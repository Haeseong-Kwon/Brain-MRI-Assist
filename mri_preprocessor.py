import nibabel as nib
import pydicom
import numpy as np
import json
import os
import argparse
from skimage.transform import resize
import matplotlib.pyplot as plt

def read_mri_file(filepath):
    """
    Reads NIfTI or DICOM files.
    Returns image data (numpy array) and header/metadata.
    """
    if filepath.endswith('.nii') or filepath.endswith('.nii.gz'):
        img = nib.load(filepath)
        data = img.get_fdata()
        header = img.header
        print(f"Loaded NIfTI file: {filepath}")
        return data, header, 'nifti'
    elif os.path.isdir(filepath):
        # Assuming a DICOM series in a directory
        # This is a simplified approach, real DICOM series loading can be complex
        dicom_files = [pydicom.dcmread(os.path.join(filepath, f)) for f in os.listdir(filepath) if f.endswith('.dcm')]
        dicom_files.sort(key=lambda x: int(x.InstanceNumber))
        
        if not dicom_files:
            raise ValueError("No DICOM files found in the directory.")

        # Assume all files have the same dimensions and are axial slices
        slice_thickness = float(dicom_files[0].SliceThickness) if 'SliceThickness' in dicom_files[0] else None
        pixel_spacing = [float(x) for x in dicom_files[0].PixelSpacing] if 'PixelSpacing' in dicom_files[0] else None

        # Create 3D array
        data = np.stack([s.pixel_array for s in dicom_files], axis=-1)
        
        # Combine relevant header info
        header = {
            "SliceThickness": slice_thickness,
            "PixelSpacing": pixel_spacing,
            "SOPInstanceUID": [s.SOPInstanceUID for s in dicom_files], # Example of extracting multiple UIDs
            "StudyInstanceUID": dicom_files[0].StudyInstanceUID,
            "SeriesInstanceUID": dicom_files[0].SeriesInstanceUID,
            "Modality": dicom_files[0].Modality,
            "PatientName": str(dicom_files[0].PatientName),
            "PatientID": dicom_files[0].PatientID,
            # Add other common DICOM tags as needed
        }
        print(f"Loaded DICOM series from directory: {filepath}")
        return data, header, 'dicom'
    elif filepath.endswith('.dcm'):
        dicom_file = pydicom.dcmread(filepath)
        data = dicom_file.pixel_array
        header = {
            "SliceThickness": float(dicom_file.SliceThickness) if 'SliceThickness' in dicom_file else None,
            "PixelSpacing": [float(x) for x in dicom_file.PixelSpacing] if 'PixelSpacing' in dicom_file else None,
            "SOPInstanceUID": dicom_file.SOPInstanceUID,
            "StudyInstanceUID": dicom_file.StudyInstanceUID,
            "SeriesInstanceUID": dicom_file.SeriesInstanceUID,
            "Modality": dicom_file.Modality,
            "PatientName": str(dicom_file.PatientName),
            "PatientID": dicom_file.PatientID,
        }
        print(f"Loaded DICOM file: {filepath}")
        return data, header, 'dicom'
    else:
        raise ValueError("Unsupported file format. Please provide a .nii, .nii.gz, .dcm file or a directory containing .dcm files.")

def normalize_image(image_data):
    """
    Normalizes image data to a [0, 1] range.
    """
    min_val = np.min(image_data)
    max_val = np.max(image_data)
    if max_val - min_val == 0:
        return np.zeros_like(image_data)
    normalized_data = (image_data - min_val) / (max_val - min_val)
    print("Image data normalized.")
    return normalized_data

def resize_image(image_data, target_shape=(128, 128, 128)):
    """
    Resizes 3D image data to a target shape.
    """
    resized_data = resize(image_data, target_shape, anti_aliasing=True)
    print(f"Image resized to {target_shape}.")
    return resized_data

def simple_skull_strip(image_data, threshold_factor=0.1):
    """
    A very basic skull-stripping prototype.
    Assumes background is usually lower intensity.
    This is a placeholder and should be replaced by more robust methods for real applications.
    """
    # Simple thresholding
    # Find a threshold based on a factor of the max intensity, assuming brain is brighter than skull/background
    threshold = np.max(image_data) * threshold_factor
    binary_mask = image_data > threshold
    
    # Apply mask
    stripped_data = image_data * binary_mask
    print("Performed simple skull stripping.")
    return stripped_data, binary_mask

def extract_metadata(header, file_type):
    """
    Extracts relevant metadata for volume calculation and general info.
    """
    metadata = {}
    if file_type == 'nifti':
        metadata['file_type'] = 'NIfTI'
        metadata['voxel_sizes'] = header.get_zooms() # typically (x, y, z)
        metadata['slice_thickness'] = metadata['voxel_sizes'][2] if len(metadata['voxel_sizes']) > 2 else None
        metadata['pixel_spacing'] = metadata['voxel_sizes'][0:2] # x, y
        metadata['dimensions'] = header['dim'][1:4].tolist() # (x, y, z)
        metadata['units'] = nib.affcodes.get_units(header['xyzt_units'])[0]
    elif file_type == 'dicom':
        metadata['file_type'] = 'DICOM'
        metadata['slice_thickness'] = header.get('SliceThickness')
        metadata['pixel_spacing'] = header.get('PixelSpacing') # typically [row_spacing, col_spacing]
        
        # Estimate dimensions from data if not directly in simplified header
        # In a real scenario, this would come from the pydicom objects directly
        # metadata['dimensions'] would need to be passed or derived more robustly
        
        # Copy other useful info
        metadata['patient_name'] = header.get('PatientName')
        metadata['patient_id'] = header.get('PatientID')
        metadata['modality'] = header.get('Modality')
        metadata['study_uid'] = header.get('StudyInstanceUID')
        metadata['series_uid'] = header.get('SeriesInstanceUID')

        # Calculate volume if all necessary metadata is present
        if metadata['slice_thickness'] and metadata['pixel_spacing']:
            try:
                # Assuming pixel_spacing is [row_spacing, col_spacing]
                # And image dimensions will be inferred later or passed in
                pass # Volume calculation will need actual image dimensions too
            except Exception as e:
                print(f"Could not calculate volume from DICOM metadata: {e}")

    print("Metadata extracted.")
    return metadata

def generate_thumbnail(image_data, output_path, title="Thumbnail"):
    """
    Generates a 2D thumbnail from the 3D image data (e.g., middle slice).
    """
    if image_data.ndim == 3:
        # Take a middle slice for thumbnail
        middle_slice = image_data[:, :, image_data.shape[2] // 2]
    elif image_data.ndim == 2:
        middle_slice = image_data
    else:
        print("Warning: Cannot generate thumbnail for image data with dimensions other than 2 or 3.")
        return

    plt.figure(figsize=(6, 6))
    plt.imshow(middle_slice, cmap='gray')
    plt.title(title)
    plt.axis('off')
    plt.savefig(output_path, bbox_inches='tight', pad_inches=0.1)
    plt.close()
    print(f"Thumbnail generated and saved to {output_path}")

def main():
    parser = argparse.ArgumentParser(description="MRI Preprocessor for NIfTI and DICOM files.")
    parser.add_argument("input_path", type=str,
                        help="Path to the MRI file (.nii, .nii.gz, .dcm) or a directory containing DICOM series.")
    parser.add_argument("--output_dir", type=str, default="./processed_mri",
                        help="Directory to save processed outputs (metadata, thumbnail).")
    parser.add_argument("--target_shape", type=str, default="128,128,128",
                        help="Target shape for resizing, e.g., '128,128,128'.")
    parser.add_argument("--threshold_factor", type=float, default=0.1,
                        help="Threshold factor for simple skull stripping (0.0 to 1.0).")

    args = parser.parse_args()

    input_path = args.input_path
    output_dir = args.output_dir
    target_shape = tuple(map(int, args.target_shape.split(',')))

    os.makedirs(output_dir, exist_ok=True)

    print(f"Starting MRI preprocessing for: {input_path}")

    try:
        # 1. Read MRI file
        image_data, header, file_type = read_mri_file(input_path)
        print(f"Original image shape: {image_data.shape}")

        # 2. Normalize image data
        normalized_data = normalize_image(image_data.copy())

        # 3. Resize image data
        resized_data = resize_image(normalized_data, target_shape)
        print(f"Resized image shape: {resized_data.shape}")

        # 4. Skull Stripping Prototype
        # Skull stripping should ideally happen before normalization/resizing for best results
        # but for a prototype, order might be less critical.
        # Let's apply it to the original data for now, then re-normalize and resize.
        stripped_original_data, _ = simple_skull_strip(image_data.copy(), args.threshold_factor)
        normalized_stripped_data = normalize_image(stripped_original_data)
        final_processed_data = resize_image(normalized_stripped_data, target_shape)
        print(f"Final processed (stripped, normalized, resized) image shape: {final_processed_data.shape}")

        # 5. Extract Metadata
        extracted_metadata = extract_metadata(header, file_type)
        extracted_metadata['processed_shape'] = final_processed_data.shape
        
        metadata_output_path = os.path.join(output_dir, "metadata.json")
        with open(metadata_output_path, 'w') as f:
            json.dump(extracted_metadata, f, indent=4)
        print(f"Extracted metadata saved to {metadata_output_path}")

        # 6. Generate Thumbnail (from the final processed data)
        thumbnail_output_path = os.path.join(output_dir, "thumbnail.png")
        generate_thumbnail(final_processed_data, thumbnail_output_path, title="Processed MRI Thumbnail")

        print("Preprocessing complete!")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()
