import torch
import torch.nn as nn
import nibabel as nib
import numpy as np
import os
import json
import argparse
# import supabase # Will be uncommented once credentials are provided

# --- Dummy Model (Placeholder for a real segmentation model like U-Net or UNETR) ---
class DummySegmentationModel(nn.Module):
    def __init__(self, in_channels=1, out_channels=1, num_classes=2):
        super().__init__()
        # In a real model, this would be a U-Net, UNETR, etc.
        # For a dummy, we just simulate an output.
        self.conv1 = nn.Conv3d(in_channels, 16, kernel_size=3, padding=1)
        self.relu = nn.ReLU()
        self.conv2 = nn.Conv3d(16, out_channels, kernel_size=3, padding=1)
        # Using sigmoid for binary segmentation, or softmax for multi-class
        self.final_activation = nn.Sigmoid() if num_classes == 2 else nn.Softmax(dim=1)
        self.num_classes = num_classes

    def forward(self, x):
        # Simulate some processing
        x = self.relu(self.conv1(x))
        x = self.conv2(x)
        return self.final_activation(x)

# --- AI Model Inference Wrapper ---
def load_model(model_path=None, in_channels=1, out_channels=1, num_classes=2, device='cpu'):
    """
    Loads a segmentation model. If model_path is None, a dummy model is returned.
    """
    model = DummySegmentationModel(in_channels, out_channels, num_classes)
    if model_path and os.path.exists(model_path):
        try:
            model.load_state_dict(torch.load(model_path, map_location=device))
            print(f"Loaded model from {model_path}")
        except Exception as e:
            print(f"Warning: Could not load model from {model_path}. Using dummy model. Error: {e}")
    else:
        print("No model path provided or model not found. Using dummy segmentation model.")
    model.to(device)
    model.eval() # Set model to evaluation mode
    return model

def perform_inference(model, preprocessed_data: np.ndarray, device: torch.device):
    """
    Performs inference on preprocessed MRI data using the loaded model.
    Returns a segmentation mask (numpy array).
    """
    # Ensure data is float32 and add batch and channel dimensions (BxCxDxHxW)
    input_tensor = torch.from_numpy(preprocessed_data).float().unsqueeze(0).unsqueeze(0)
    input_tensor = input_tensor.to(device)

    with torch.no_grad(): # Disable gradient calculation for inference
        output = model(input_tensor)
    
    # Post-process output: remove batch and channel dims, convert to numpy
    # Apply a threshold for binary mask, assuming output is probabilities
    mask = (output.squeeze(0).squeeze(0) > 0.5).cpu().numpy().astype(np.uint8)
    print(f"Inference complete. Mask shape: {mask.shape}")
    return mask

# --- Volume Calculation ---
def calculate_volume(segmentation_mask: np.ndarray, metadata: dict) -> dict:
    """
    Calculates the volume of segmented regions in mm³.
    Requires 'pixel_spacing' (for x,y) and 'slice_thickness' (for z) from metadata.
    Segmentation mask is expected to be binary or multi-class (0, 1, 2...).
    """
    if 'pixel_spacing' not in metadata or 'slice_thickness' not in metadata:
        raise ValueError("Metadata must contain 'pixel_spacing' and 'slice_thickness' for volume calculation.")

    # Ensure pixel_spacing is a list/tuple of two values
    pixel_spacing = metadata['pixel_spacing']
    if isinstance(pixel_spacing, (list, tuple)) and len(pixel_spacing) == 2:
        voxel_width = float(pixel_spacing[0])
        voxel_height = float(pixel_spacing[1])
    elif isinstance(pixel_spacing, (list, tuple)) and len(pixel_spacing) > 2: # For NIfTI, might be (x,y,z)
        voxel_width = float(pixel_spacing[0])
        voxel_height = float(pixel_spacing[1])
        if metadata.get('file_type') == 'NIfTI' and 'voxel_sizes' in metadata:
            # If NIfTI, try to get from voxel_sizes explicitly
            voxel_width = metadata['voxel_sizes'][0]
            voxel_height = metadata['voxel_sizes'][1]
    else: # Fallback for single value or other formats
        voxel_width = float(pixel_spacing)
        voxel_height = float(pixel_spacing)

    slice_thickness = float(metadata['slice_thickness'])
    
    # Volume of a single voxel in mm³
    voxel_volume_mm3 = voxel_width * voxel_height * slice_thickness
    
    unique_labels = np.unique(segmentation_mask)
    segment_volumes = {}

    for label in unique_labels:
        if label == 0: # Assuming 0 is background
            continue
        num_voxels = np.sum(segmentation_mask == label)
        volume = num_voxels * voxel_volume_mm3
        segment_volumes[f"segment_{label}_volume_mm3"] = float(volume)
        print(f"Segment {label} volume: {volume:.2f} mm³")
    
    return segment_volumes

# --- Dice Score Evaluation (Optional) ---
def dice_coefficient(prediction: np.ndarray, ground_truth: np.ndarray, num_classes=None) -> dict:
    """
    Calculates the Dice Coefficient between prediction and ground truth.
    Supports binary and multi-class (per label) calculation.
    """
    if prediction.shape != ground_truth.shape:
        raise ValueError("Prediction and ground truth masks must have the same shape.")

    if num_classes is None:
        num_classes = max(np.max(prediction), np.max(ground_truth)) + 1
    
    dice_scores = {}
    for i in range(1, num_classes): # Iterate through classes, excluding background (label 0)
        pred_class = (prediction == i)
        gt_class = (ground_truth == i)

        intersection = np.sum(pred_class * gt_class)
        union = np.sum(pred_class) + np.sum(gt_class)

        if union == 0:
            dice_scores[f"dice_score_class_{i}"] = 1.0 # Both are empty, perfect match
        else:
            dice_scores[f"dice_score_class_{i}"] = (2. * intersection) / union
        print(f"Dice score for class {i}: {dice_scores[f'dice_score_class_{i}']:.4f}")
    
    return dice_scores

# --- Mask Export ---
def export_mask_as_nifti(mask_data: np.ndarray, original_nifti_path: str, output_path: str):
    """
    Saves the segmentation mask as a NIfTI file, using the original NIfTI's affine.
    """
    if not os.path.exists(original_nifti_path):
        raise FileNotFoundError(f"Original NIfTI file not found: {original_nifti_path}")
    
    original_img = nib.load(original_nifti_path)
    # Ensure mask_data has the same spatial dimensions as the original image data
    # Resample mask to original image space if necessary, but for now assuming it's already aligned/resized
    # If the mask is already resized, the affine might need to be adjusted or a new identity affine used.
    # For simplicity, we assume the mask is in the same space as the data used for preprocessing that had the header.
    # A more robust solution would resample the mask back to the original resolution.

    # If the mask is a different shape than the original image after resizing
    # this will need proper affine transformation or resampling.
    # For now, let's assume the mask's shape is the same as the preprocessed input's shape.
    # If the mask dimensions are different from the original_img.shape, we need to handle it.
    # For now, we'll create a new NIfTI image with identity affine if shapes mismatch.
    if mask_data.shape == original_img.shape:
        nifti_mask = nib.Nifti1Image(mask_data, original_img.affine, original_img.header)
    else:
        # If the mask was resized, we might need a simpler affine or resample the mask.
        # For this prototype, if shapes differ, use identity affine and new header.
        print(f"Warning: Mask shape {mask_data.shape} differs from original NIfTI shape {original_img.shape}. "
              "Saving mask with an identity affine.")
        nifti_mask = nib.Nifti1Image(mask_data, np.eye(4)) # Use identity affine
        
    nib.save(nifti_mask, output_path)
    print(f"Segmentation mask saved to {output_path}")

# --- Supabase Integration (Placeholders for now) ---
# SUPABASE_URL = "YOUR_SUPABASE_URL" # Placeholder
# SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY" # Placeholder
# supabase_client = None # Placeholder

def setup_supabase_client(url, key):
    # global supabase_client
    # from supabase import create_client, Client
    # supabase_client: Client = create_client(url, key)
    print("Supabase client setup (placeholder). Real setup will use credentials.")
    return True # Simulate success

def upload_to_supabase_storage(bucket_name, file_path, storage_path):
    # if not supabase_client:
    #     raise RuntimeError("Supabase client not initialized.")
    #
    # with open(file_path, 'rb') as f:
    #     data = f.read()
    #     response = supabase_client.storage.from_(bucket_name).upload(storage_path, data)
    #     if response.get('error'):
    #         raise Exception(f"Supabase Storage upload failed: {response['error']}")
    #     print(f"File uploaded to Supabase Storage: {storage_path}")
    #     return response['Key'] # Or similar identifier
    print(f"Uploaded {file_path} to Supabase Storage at {storage_path} (placeholder).")
    return f"supabase://{bucket_name}/{storage_path}"

def insert_results_to_supabase_db(table_name, results_data):
    # if not supabase_client:
    #     raise RuntimeError("Supabase client not initialized.")
    #
    # response = supabase_client.table(table_name).insert(results_data).execute()
    # if response.get('error'):
    #     raise Exception(f"Supabase DB insert failed: {response['error']}")
    # print(f"Results inserted into Supabase table {table_name}: {results_data}")
    # return response['data']
    print(f"Inserted results into Supabase table {table_name}: {results_data} (placeholder).")
    return {"id": "dummy_id"}


# --- Main Execution Flow ---
def main():
    parser = argparse.ArgumentParser(description="AI Model Inference for MRI Segmentation.")
    parser.add_argument("preprocessed_data_path", type=str,
                        help="Path to the preprocessed MRI data (e.g., numpy array saved as .npy, or derived from original NIfTI).")
    parser.add_argument("--original_nifti_path", type=str,
                        help="Path to the original NIfTI file (needed for mask export affine).")
    parser.add_argument("--metadata_path", type=str,
                        help="Path to the metadata.json generated by mri_preprocessor.py.")
    parser.add_argument("--ground_truth_path", type=str, default=None,
                        help="Optional: Path to the ground truth NIfTI mask for Dice score evaluation.")
    parser.add_argument("--output_dir", type=str, default="./segmentation_output",
                        help="Directory to save segmentation outputs (mask, results).")
    parser.add_argument("--model_path", type=str, default=None,
                        help="Path to the trained PyTorch model state_dict file (.pt).")
    parser.add_argument("--supabase_url", type=str, default="YOUR_SUPABASE_URL",
                        help="Supabase Project URL.")
    parser.add_argument("--supabase_key", type=str, default="YOUR_SUPABASE_ANON_KEY",
                        help="Supabase Project Anon Key.")
    parser.add_argument("--supabase_bucket", type=str, default="mri_segmentation_masks",
                        help="Supabase Storage bucket name for masks.")
    parser.add_argument("--supabase_table", type=str, default="segmentation_results",
                        help="Supabase table name for results.")

    args = parser.parse_args()

    # Determine device for PyTorch
    device = torch.device("mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    os.makedirs(args.output_dir, exist_ok=True)

    # 1. Load Preprocessed Data and Metadata
    if not os.path.exists(args.preprocessed_data_path):
        raise FileNotFoundError(f"Preprocessed data not found: {args.preprocessed_data_path}")
    if not os.path.exists(args.metadata_path):
        raise FileNotFoundError(f"Metadata file not found: {args.metadata_path}")
    
    # Assuming preprocessed_data_path is a NIfTI file for simplicity, 
    # as mri_preprocessor.py processes and outputs a file.
    # In a real pipeline, the preprocessor might save a numpy array.
    # For now, let's assume it's a NIfTI from which we can extract data.
    # It would be better if mri_preprocessor.py saved the processed array as a .npy file.
    
    try:
        # Try loading as NIfTI, if it fails, assume it's a numpy array.
        preprocessed_img = nib.load(args.preprocessed_data_path)
        preprocessed_data = preprocessed_img.get_fdata()
        # Normalize the preprocessed data to 0-1 range before inference if not already.
        preprocessed_data = (preprocessed_data - np.min(preprocessed_data)) / (np.max(preprocessed_data) - np.min(preprocessed_data) + 1e-8)
        print(f"Loaded preprocessed data from NIfTI: {args.preprocessed_data_path}, shape: {preprocessed_data.shape}")
    except Exception:
        # Fallback to loading as numpy array if it's not a NIfTI file
        preprocessed_data = np.load(args.preprocessed_data_path)
        print(f"Loaded preprocessed data from .npy: {args.preprocessed_data_path}, shape: {preprocessed_data.shape}")

    with open(args.metadata_path, 'r') as f:
        metadata = json.load(f)
    print(f"Loaded metadata from {args.metadata_path}")
    
    # 2. Load Model and Perform Inference
    model = load_model(args.model_path, device=device)
    segmentation_mask = perform_inference(model, preprocessed_data, device)

    # 3. Volume Calculation
    segment_volumes = calculate_volume(segmentation_mask, metadata)

    # 4. Dice Score Evaluation (if ground truth is provided)
    dice_scores = {}
    if args.ground_truth_path:
        if not os.path.exists(args.ground_truth_path):
            raise FileNotFoundError(f"Ground truth file not found: {args.ground_truth_path}")
        
        gt_img = nib.load(args.ground_truth_path)
        ground_truth_mask = gt_img.get_fdata()
        
        # Resize ground truth to match segmentation mask if necessary
        if ground_truth_mask.shape != segmentation_mask.shape:
            print(f"Warning: Ground truth shape {ground_truth_mask.shape} differs from prediction shape {segmentation_mask.shape}. Resizing ground truth.")
            ground_truth_mask = resize(ground_truth_mask, segmentation_mask.shape, order=0, anti_aliasing=False, preserve_range=True).astype(np.uint8)
        
        dice_scores = dice_coefficient(segmentation_mask, ground_truth_mask)
    
    # 5. Mask Export & Supabase Sync
    mask_output_filename = f"segmentation_mask_{os.path.basename(args.preprocessed_data_path).split('.')[0]}.nii.gz"
    mask_output_path = os.path.join(args.output_dir, mask_output_filename)

    if not args.original_nifti_path:
        print("Warning: Original NIfTI path not provided. Mask will be saved with identity affine.")
        # Create a dummy NIfTI image for affine if no original_nifti_path is given
        # This is a simplification; ideally, the affine should be derived from the preprocessed data.
        dummy_img = nib.Nifti1Image(np.zeros(segmentation_mask.shape), np.eye(4))
        nib.save(nib.Nifti1Image(segmentation_mask, dummy_img.affine, dummy_img.header), mask_output_path)
    else:
        export_mask_as_nifti(segmentation_mask, args.original_nifti_path, mask_output_path)

    # Supabase Integration
    # try:
    #     if setup_supabase_client(args.supabase_url, args.supabase_key):
    #         supabase_storage_path = f"public/{mask_output_filename}"
    #         mask_url = upload_to_supabase_storage(args.supabase_bucket, mask_output_path, supabase_storage_path)
    #
    #         results_to_db = {
    #             "input_data_path": args.preprocessed_data_path,
    #             "segmentation_mask_url": mask_url,
    #             **segment_volumes,
    #             **dice_scores,
    #             "processed_at": datetime.utcnow().isoformat() + "Z",
    #             "device_used": str(device),
    #         }
    #         insert_results_to_supabase_db(args.supabase_table, results_to_db)
    #
    # except Exception as e:
    #     print(f"Supabase operation failed: {e}")
    #     print("Please ensure Supabase URL and Key are correct and Supabase services are running.")
    print("Supabase integration is currently commented out. Uncomment and provide credentials to enable.")

    print("Segmentation engine execution complete!")

if __name__ == "__main__":
    main()
