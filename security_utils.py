import os
import pydicom
import nibabel as nib
import numpy as np
import argparse
from datetime import datetime
import supabase # Supabase 설치 후 주석 해제

# --- Supabase Configuration (Placeholder) ---
# SUPABASE_URL = os.environ.get("SUPABASE_URL")
# SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
# supabase_client = None

def get_supabase_client(url, key):
    """
    Supabase 클라이언트를 초기화하고 반환합니다.
    자격 증명이 없을 경우 더미 클라이언트를 반환합니다.
    """
    if not url or not key or url == "YOUR_SUPABASE_URL" or key == "YOUR_SUPABASE_ANON_KEY":
        print("경고: Supabase 자격 증명이 설정되지 않았습니다. 더미 클라이언트를 사용합니다.")
        return DummySupabaseClient()
    
    from supabase import create_client, Client # supabase 설치 후 주석 해제
    return create_client(url, key)
    # print("Supabase 클라이언트 (더미) 초기화.")
    # return DummySupabaseClient() # 실제 클라이언트 대신 더미 클라이언트 반환

class DummySupabaseClient:
    """Supabase 클라이언트가 없을 때 사용할 더미 클라이언트."""
    def table(self, table_name):
        print(f"더미: 테이블 '{table_name}'에 접근합니다.")
        return self

    def select(self, columns):
        print(f"더미: 컬럼 '{columns}'을(를) 선택합니다.")
        return self

    def eq(self, column, value):
        print(f"더미: '{column}'이(가) '{value}'와(과) 같은 조건을 추가합니다.")
        return self

    def order(self, column, desc):
        print(f"더미: '{column}'을(를) 정렬합니다.")
        return self

    def execute(self):
        print("더미: 쿼리를 실행합니다. 더미 데이터를 반환합니다.")
        return {"data": [], "error": None}

    def storage(self):
        print("더미: Supabase Storage에 접근합니다.")
        return self
    
    def from_(self, bucket_name):
        print(f"더미: '{bucket_name}' 버킷에 접근합니다.")
        return self
    
    def upload(self, path, data):
        print(f"더미: '{path}'에 데이터를 업로드합니다.")
        return {"error": None} # Simulate success


# --- DICOM Anonymizer ---
def anonymize_dicom(dicom_filepath, output_filepath=None):
    """
    DICOM 파일의 PII를 삭제하거나 가명화합니다.
    output_filepath가 None이면 원본 파일을 덮어씁니다 (주의!).
    """
    try:
        ds = pydicom.dcmread(dicom_filepath)

        # 개인 식별 정보(PII) 삭제 또는 가명화
        # DICOM 표준에 따라 일반적인 PII 태그들을 처리합니다.
        if 'PatientName' in ds:
            ds.PatientName = "Anonymous"
        if 'PatientID' in ds:
            ds.PatientID = "AnonID"
        if 'PatientBirthDate' in ds:
            ds.PatientBirthDate = "19000101" # 더미 날짜
        if 'PatientSex' in ds:
            del ds.PatientSex # 성별 정보 삭제 (필요시 "O" (Other)로 변경)
        if 'StudyID' in ds:
            ds.StudyID = "AnonStudy"
        if 'AccessionNumber' in ds:
            del ds.AccessionNumber
        if 'OtherPatientIDs' in ds:
            del ds.OtherPatientIDs
        if 'OtherPatientNames' in ds:
            del ds.OtherPatientNames
        if 'PatientBirthTime' in ds:
            del ds.PatientBirthTime
        if 'MedicalRecordLocator' in ds:
            del ds.MedicalRecordLocator
        if 'InstitutionName' in ds:
            ds.InstitutionName = "AnonymizedInstitution"
        if 'PhysiciansOfRecord' in ds:
            ds.PhysiciansOfRecord = "AnonymizedPhysician"
        # 기타 민감한 태그 제거/수정 필요 시 추가

        # UID는 익명화하지 않는 것이 일반적이나, 필요시 새 UID를 생성하여 대체할 수 있습니다.
        # ds.SOPInstanceUID = pydicom.uid.generate_uid() 
        # ds.SeriesInstanceUID = pydicom.uid.generate_uid()
        # ds.StudyInstanceUID = pydicom.uid.generate_uid()

        if output_filepath:
            ds.save_as(output_filepath)
            print(f"DICOM 파일 익명화 및 '{output_filepath}'로 저장 완료.")
        else:
            ds.save_as(dicom_filepath)
            print(f"DICOM 파일 익명화 및 원본 '{dicom_filepath}' 덮어쓰기 완료.")
        return True
    except Exception as e:
        print(f"DICOM 익명화 중 오류 발생: {e}")
        return False

# --- Secure Export Utility ---
def dicom_to_nifti_and_export(dicom_filepath_or_dir, output_nifti_filepath, supabase_client=None, supabase_bucket="anonymized_mri_scans", supabase_storage_path=None):
    """
    DICOM 파일(또는 시리즈)을 NIfTI로 변환하고, 선택적으로 Supabase Storage에 업로드합니다.
    """
    try:
        # DICOM 데이터 읽기 (mri_preprocessor.py의 로직을 재사용)
        # 단일 DICOM 파일 처리
        if os.path.isfile(dicom_filepath_or_dir) and dicom_filepath_or_dir.endswith('.dcm'):
            ds = pydicom.dcmread(dicom_filepath_or_dir)
            image_data = ds.pixel_array
            # 어파인 정보 (affine)가 없으므로 간단한 단위 행렬 사용
            # 실제 어파인 정보를 얻으려면 더 복잡한 DICOM 처리 필요 (DICOM 시리즈)
            affine = np.eye(4) 
        # DICOM 시리즈 디렉토리 처리
        elif os.path.isdir(dicom_filepath_or_dir):
            dicom_files = [pydicom.dcmread(os.path.join(dicom_filepath_or_dir, f)) for f in os.listdir(dicom_filepath_or_dir) if f.endswith('.dcm')]
            dicom_files.sort(key=lambda x: int(x.InstanceNumber))
            
            if not dicom_files:
                raise ValueError("지정된 디렉토리에서 DICOM 파일을 찾을 수 없습니다.")

            # 3D 배열 생성
            image_data = np.stack([s.pixel_array for s in dicom_files], axis=-1)
            # 어파인 정보는 DICOM 시리즈에서 추출해야 하지만, 여기서는 단순화를 위해 단위 행렬 사용
            affine = np.eye(4)
        else:
            raise ValueError("유효한 DICOM 파일 또는 디렉토리를 제공하십시오.")

        # NIfTI 파일로 저장
        nifti_img = nib.Nifti1Image(image_data, affine)
        nib.save(nifti_img, output_nifti_filepath)
        print(f"DICOM 데이터를 NIfTI 파일 '{output_nifti_filepath}'로 변환 및 저장 완료.")

        # Supabase Storage에 업로드
        if supabase_client and supabase_storage_path:
            with open(output_nifti_filepath, 'rb') as f:
                file_data = f.read()
            
            response = supabase_client.storage().from_(supabase_bucket).upload(supabase_storage_path, file_data)
            if response.get("error"):
                raise Exception(f"Supabase Storage 업로드 실패: {response['error']}")
            print(f"익명화된 NIfTI 파일을 Supabase Storage '{supabase_bucket}/{supabase_storage_path}'에 업로드 완료.")
            return True
        else:
            print("Supabase 클라이언트 또는 저장 경로가 지정되지 않아 Supabase Storage에 업로드하지 않습니다.")
            return True
    except Exception as e:
        print(f"DICOM-NIfTI 변환 및 내보내기 중 오류 발생: {e}")
        return False

# --- Database Audit (제안) ---
def suggest_db_audit_logic():
    """
    mri_scans 테이블에서 'is_shared' 플래그를 관리하고,
    공유 만료 시 접근을 차단하는 백엔드 검증 로직을 제안합니다.
    """
    print("
--- 백엔드 데이터베이스 감사 로직 제안 ---")
    print("1. 'mri_scans' 테이블 구조:")
    print("   - `id`: Primary Key, UUID")
    print("   - `patient_id`: 환자 ID (익명화된 ID)")
    print("   - `original_scan_id`: 원본 스캔 ID (내부 참조용)")
    print("   - `anonymized_nifti_url`: 익명화된 NIfTI 파일의 Supabase Storage URL")
    print("   - `is_shared`: BOOLEAN, True이면 외부에 공유됨 (기본값 False)")
    print("   - `shared_until`: TIMESTAMPZ, 공유 만료 일시 (NULL이면 무기한 공유)")
    print("   - `created_at`: TIMESTAMPZ")
    print("   - `updated_at`: TIMESTAMPZ")
    
    print("
2. 'is_shared' 플래그 관리 로직:")
    print("   - 익명화된 NIfTI 파일이 Supabase Storage에 업로드되면, 해당 `mri_scans` 레코드의 `is_shared`를 True로 설정하고 `anonymized_nifti_url`을 업데이트합니다.")
    print("   - 공유 기간이 설정된 경우 `shared_until` 필드를 함께 업데이트합니다.")
    
    print("
3. 공유 만료 시 접근 차단 백엔드 검증 로직 (Supabase RLS 및 Edge Function/API 사용):")
    print("   a. Supabase Row Level Security (RLS):")
    print("      - `mri_scans` 테이블에 RLS 정책을 설정하여, `is_shared`가 True이고 `shared_until`이 현재 시간보다 미래인 경우에만 해당 레코드에 접근을 허용합니다.")
    print("      - 예시 RLS 정책 (SELECT 권한): `(is_shared = TRUE AND (shared_until IS NULL OR shared_until > now()))`")
    print("      - 이는 데이터베이스 레벨에서 접근을 제어하여, 만료된 공유 데이터에 대한 API 접근을 원천적으로 차단합니다.")
    
    print("   b. Supabase Edge Functions (API):")
    print("      - 클라이언트가 익명화된 NIfTI 파일에 접근하려 할 때, 직접 Storage URL을 제공하는 대신 Edge Function을 통해 접근을 중개합니다.")
    print("      - Edge Function은 요청을 받으면, `mri_scans` 테이블에서 해당 파일의 `shared_until` 상태를 확인합니다.")
    print("      - `shared_until`이 만료되었거나 `is_shared`가 False인 경우, 접근을 거부하고 403 Forbidden 응답을 반환합니다.")
    print("      - 유효한 경우에만 Storage의 서명된 URL(Signed URL)을 생성하여 클라이언트에 반환합니다. 이는 제한된 시간 동안만 유효한 다운로드 링크를 제공합니다.")
    
    print("
4. 주기적인 만료 처리 (Optional):")
    print("   - Supabase Scheduler 또는 외부 Cron 작업을 사용하여 주기적으로 `mri_scans` 테이블을 스캔합니다.")
    print("   - `shared_until`이 지난 레코드에 대해 `is_shared` 플래그를 False로 업데이트하거나, 해당 Storage 파일을 삭제하여 접근을 명시적으로 차단합니다.")
    print("   - 이는 RLS와 Edge Function이 실시간 접근을 제어하지만, 데이터베이스 내 `is_shared` 상태를 최신으로 유지하여 관리 편의성을 높입니다.")
    print("
--- 제안 종료 ---")


# --- Main Execution ---
def main():
    parser = argparse.ArgumentParser(description="DICOM 개인 정보 익명화 및 보안 내보내기 유틸리티.")
    parser.add_argument("input_path", type=str,
                        help="익명화할 DICOM 파일 경로 또는 DICOM 시리즈가 포함된 디렉토리 경로.")
    parser.add_argument("--output_dicom_path", type=str, default=None,
                        help="익명화된 DICOM 파일을 저장할 경로 (지정하지 않으면 원본 덮어씀).")
    parser.add_argument("--output_nifti_path", type=str,
                        help="익명화된 데이터를 NIfTI 파일로 저장할 경로 (필수).")
    parser.add_argument("--supabase_url", type=str, default=os.environ.get("SUPABASE_URL", "YOUR_SUPABASE_URL"),
                        help="Supabase 프로젝트 URL.")
    parser.add_argument("--supabase_key", type=str, default=os.environ.get("SUPABASE_KEY", "YOUR_SUPABASE_ANON_KEY"),
                        help="Supabase 프로젝트 Anon 키.")
    parser.add_argument("--supabase_bucket", type=str, default="anonymized_mri_scans",
                        help="익명화된 NIfTI 파일을 업로드할 Supabase Storage 버킷 이름.")
    parser.add_argument("--supabase_storage_path", type=str, default=None,
                        help="Supabase Storage에 업로드할 파일 경로 (예: `public/anon_scan_123.nii.gz`). 지정하지 않으면 업로드하지 않음.")

    args = parser.parse_args()

    if not args.output_nifti_path:
        parser.error("--output_nifti_path는 필수 인자입니다.")

    # 1. DICOM Anonymizer
    print("DICOM 익명화를 시작합니다...")
    if not anonymize_dicom(args.input_path, args.output_dicom_path):
        print("DICOM 익명화에 실패하여 종료합니다.")
        return

    # 2. Secure Export Utility
    print("익명화된 DICOM 데이터를 NIfTI로 변환하고 내보냅니다...")
    supabase_client = None
    if args.supabase_storage_path and args.supabase_url != "YOUR_SUPABASE_URL" and args.supabase_key != "YOUR_SUPABASE_ANON_KEY":
        supabase_client = get_supabase_client(args.supabase_url, args.supabase_key)
    
    if not dicom_to_nifti_and_export(args.output_dicom_path if args.output_dicom_path else args.input_path,
                                    args.output_nifti_path,
                                    supabase_client=supabase_client,
                                    supabase_bucket=args.supabase_bucket,
                                    supabase_storage_path=args.supabase_storage_path):
        print("NIfTI 변환 및 내보내기에 실패하여 종료합니다.")
        return

    # 3. Database Audit (제안만 출력)
    suggest_db_audit_logic()

    print("
보안 유틸리티 실행 완료!")
    print("최종 보안 점검: 구현된 익명화 로직과 데이터 흐름을 검토하고, 실제 사용 시 개인 정보 보호 규정(예: HIPAA, GDPR) 준수 여부를 확인하십시오.")
    print("특히 'mri_scans' 테이블의 `is_shared` 플래그와 `shared_until` 필드 관리에 대한 백엔드 로직은 추가 구현이 필요합니다.")


if __name__ == "__main__":
    main()
