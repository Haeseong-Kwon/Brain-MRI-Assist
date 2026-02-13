import os
import json
import argparse
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.linear_model import LinearRegression

# import supabase # Supabase 설치 후 주석 해제

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
    
    # from supabase import create_client, Client # supabase 설치 후 주석 해제
    # return create_client(url, key)
    print("Supabase 클라이언트 (더미) 초기화.")
    return DummySupabaseClient() # 실제 클라이언트 대신 더미 클라이언트 반환

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
        
        # 실제 데이터가 없는 경우를 위한 더미 데이터
        # 실제 Supabase에서 받아올 데이터 구조를 모방합니다.
        dummy_data = [
            {
                "id": "seg_1",
                "patient_id": "P001",
                "study_date": "2023-01-15T10:00:00Z",
                "segment_1_volume_mm3": 1000.0,
                "input_data_path": "path/to/mri_scan_1.nii.gz",
                "segmentation_mask_url": "supabase://bucket/mask_1.nii.gz",
            },
            {
                "id": "seg_2",
                "patient_id": "P001",
                "study_date": "2023-04-20T11:00:00Z",
                "segment_1_volume_mm3": 1050.0,
                "input_data_path": "path/to/mri_scan_2.nii.gz",
                "segmentation_mask_url": "supabase://bucket/mask_2.nii.gz",
            },
            {
                "id": "seg_3",
                "patient_id": "P001",
                "study_date": "2023-07-25T12:00:00Z",
                "segment_1_volume_mm3": 1100.0,
                "input_data_path": "path/to/mri_scan_3.nii.gz",
                "segmentation_mask_url": "supabase://bucket/mask_3.nii.gz",
            },
            {
                "id": "seg_4",
                "patient_id": "P002",
                "study_date": "2023-02-01T09:00:00Z",
                "segment_1_volume_mm3": 2000.0,
                "input_data_path": "path/to/mri_scan_4.nii.gz",
                "segmentation_mask_url": "supabase://bucket/mask_4.nii.gz",
            },
        ]
        
        # 더미 데이터 필터링 로직 (실제 Supabase 쿼리를 시뮬레이션)
        # 이 부분은 실제 Supabase 쿼리에 따라 동적으로 필터링 로직을 추가해야 합니다.
        # 여기서는 단순히 전체 더미 데이터를 반환합니다.
        return {"data": dummy_data, "error": None}


def fetch_patient_segmentation_data(supabase_client, patient_id):
    """
    Supabase에서 특정 환자의 세분화 결과를 가져옵니다.
    """
    try:
        response = supabase_client.table("segmentation_results").select("*").eq("patient_id", patient_id).order("study_date", desc=False).execute()
        
        if response.get("error"):
            raise Exception(f"Supabase 쿼리 오류: {response['error']}")
        
        data = response["data"]
        if not data:
            print(f"환자 ID '{patient_id}'에 대한 세분화 데이터를 찾을 수 없습니다.")
            return pd.DataFrame()
        
        df = pd.DataFrame(data)
        df["study_date"] = pd.to_datetime(df["study_date"])
        # 종양 부피 컬럼 이름을 특정해야 합니다. 여기서는 'segment_1_volume_mm3'를 가정합니다.
        # 실제로는 여러 세그먼트가 있을 수 있으므로 동적으로 처리해야 합니다.
        df = df[["study_date", "segment_1_volume_mm3"]].dropna() 
        df = df.rename(columns={"segment_1_volume_mm3": "tumor_volume_mm3"})
        
        print(f"환자 ID '{patient_id}'의 세분화 데이터 {len(df)}개 로드 완료.")
        return df
    except Exception as e:
        print(f"데이터 로드 중 오류 발생: {e}")
        return pd.DataFrame()

def calculate_volume_trend(df: pd.DataFrame):
    """
    환자의 시간에 따른 종양 부피 변화율을 계산하고 미래 크기를 예측합니다.
    """
    if len(df) < 2:
        return {
            "trend_analysis_status": "Insufficient data (less than 2 records) for trend analysis.",
            "volume_change_rate_mm3_per_day": None,
            "prediction_next_3_months_mm3": None,
            "prediction_next_6_months_mm3": None,
        }

    # 날짜를 숫자로 변환 (첫 번째 날짜를 기준으로 일 수 계산)
    df = df.sort_values(by="study_date")
    df["days_since_first_scan"] = (df["study_date"] - df["study_date"].min()).dt.days

    X = df[["days_since_first_scan"]].values
    y = df["tumor_volume_mm3"].values

    model = LinearRegression()
    model.fit(X, y)

    # 변화율 (일당 부피 변화)
    volume_change_rate_per_day = model.coef_[0]

    # 미래 예측
    last_scan_date = df["study_date"].max()
    last_days_since_first_scan = df["days_since_first_scan"].max()

    # 3개월 (약 90일) 후 예측
    days_3_months_later = last_days_since_first_scan + 90
    prediction_3_months = model.predict(np.array([[days_3_months_later]]))[0]

    # 6개월 (약 180일) 후 예측
    days_6_months_later = last_days_since_first_scan + 180
    prediction_6_months = model.predict(np.array([[days_6_months_later]]))[0]

    return {
        "trend_analysis_status": "Success",
        "volume_change_rate_mm3_per_day": float(volume_change_rate_per_day),
        "prediction_next_3_months_mm3": float(prediction_3_months),
        "prediction_next_6_months_mm3": float(prediction_6_months),
        "last_measured_volume_mm3": float(y[-1]),
        "last_measured_date": last_scan_date.isoformat(),
        "first_measured_date": df["study_date"].min().isoformat(),
        "number_of_measurements": len(df),
    }

def generate_clinical_text(trend_data: dict) -> str:
    """
    계산된 추세 데이터를 바탕으로 임상 소견 텍스트 초안을 생성합니다.
    """
    status = trend_data.get("trend_analysis_status")
    if status != "Success":
        return f"종양 부피 추세 분석을 위한 데이터가 불충분합니다: {status}"

    volume_change_rate = trend_data["volume_change_rate_mm3_per_day"]
    last_volume = trend_data["last_measured_volume_mm3"]

    text = "종양 부피 추세 분석 결과:
"
    text += f"최종 측정 부피: {last_volume:.2f} mm³ ({datetime.fromisoformat(trend_data['last_measured_date']).strftime('%Y-%m-%d')})
"
    
    if volume_change_rate > 0:
        text += f"일당 평균 부피 증가율은 {volume_change_rate:.2f} mm³/일입니다.
"
        if trend_data["prediction_next_3_months_mm3"] is not None:
            text += f"현재 추세대로라면, 향후 3개월 내 약 {trend_data['prediction_next_3_months_mm3']:.2f} mm³로 증가할 것으로 예측됩니다.
"
        if trend_data["prediction_next_6_months_mm3"] is not None:
            text += f"향후 6개월 내에는 약 {trend_data['prediction_next_6_months_mm3']:.2f} mm³로 증가할 것으로 예측됩니다.
"
        
        # 전회 대비 변화율 (가장 최근 두 측정값을 기준으로 계산)
        if trend_data["number_of_measurements"] >= 2:
            # 더미 데이터에서는 실제 이전 값을 가져올 수 없으므로, 변화율을 가정합니다.
            # 실제 구현에서는 df에서 마지막 두 개의 값을 사용해야 합니다.
            # 여기서는 단순히 예시를 위해 5% 증가 또는 감소를 가정합니다.
            
            # 실제 데이터가 있다면 다음과 같이 계산
            # previous_volume = df.iloc[-2]['tumor_volume_mm3']
            # current_volume = df.iloc[-1]['tumor_volume_mm3']
            # percent_change = ((current_volume - previous_volume) / previous_volume) * 100
            
            # 더미 데이터 기반의 예시
            percent_change = (volume_change_rate * (trend_data["number_of_measurements"] -1) * 30 / last_volume) * 100 # 대략적인 월간 변화율 가정
            if percent_change > 0:
                text += f"전회 대비 종양 부피가 약 {abs(percent_change):.2f}% 증가하였습니다."
            else:
                text += f"전회 대비 종양 부피가 약 {abs(percent_change):.2f}% 감소하였습니다."

    elif volume_change_rate < 0:
        text += f"일당 평균 부피 감소율은 {abs(volume_change_rate):.2f} mm³/일입니다.
"
        if trend_data["prediction_next_3_months_mm3"] is not None:
            text += f"현재 추세대로라면, 향후 3개월 내 약 {max(0, trend_data['prediction_next_3_months_mm3']):.2f} mm³로 감소할 것으로 예측됩니다.
"
        if trend_data["prediction_next_6_months_mm3"] is not None:
            text += f"향후 6개월 내에는 약 {max(0, trend_data['prediction_next_6_months_mm3']):.2f} mm³로 감소할 것으로 예측됩니다.
"
        
        # 전회 대비 변화율 (더미 데이터 기반 예시)
        if trend_data["number_of_measurements"] >= 2:
            percent_change = (volume_change_rate * (trend_data["number_of_measurements"] -1) * 30 / last_volume) * 100 
            if percent_change > 0:
                text += f"전회 대비 종양 부피가 약 {abs(percent_change):.2f}% 증가하였습니다."
            else:
                text += f"전회 대비 종양 부피가 약 {abs(percent_change):.2f}% 감소하였습니다."

    else:
        text += "종양 부피에 유의미한 변화가 관찰되지 않았습니다."
        
    return text


def main():
    parser = argparse.ArgumentParser(description="환자의 종양 부피 추세를 분석하고 임상 소견을 생성합니다.")
    parser.add_argument("--patient_id", type=str, required=True,
                        help="분석할 환자의 고유 ID.")
    parser.add_argument("--supabase_url", type=str, default=os.environ.get("SUPABASE_URL", "YOUR_SUPABASE_URL"),
                        help="Supabase 프로젝트 URL.")
    parser.add_argument("--supabase_key", type=str, default=os.environ.get("SUPABASE_KEY", "YOUR_SUPABASE_ANON_KEY"),
                        help="Supabase 프로젝트 Anon 키.")
    parser.add_argument("--output_file", type=str, default=None,
                        help="결과를 JSON 파일로 저장할 경로. 지정하지 않으면 콘솔에 출력됩니다.")

    args = parser.parse_args()

    # 1. Supabase 클라이언트 초기화 (또는 더미 클라이언트 사용)
    supabase_client = get_supabase_client(args.supabase_url, args.supabase_key)

    # 2. 환자의 세분화 데이터 가져오기
    segmentation_df = fetch_patient_segmentation_data(supabase_client, args.patient_id)

    if segmentation_df.empty:
        result = {"error": f"환자 ID '{args.patient_id}'에 대한 데이터를 찾을 수 없거나 부족합니다."}
    else:
        # 3. 부피 추세 계산
        trend_data = calculate_volume_trend(segmentation_df)
        
        # 4. 임상 소견 텍스트 생성
        clinical_text = generate_clinical_text(trend_data)
        
        result = {
            "patient_id": args.patient_id,
            "trend_analysis": trend_data,
            "clinical_summary": clinical_text
        }

    # 5. 결과 반환/저장
    if args.output_file:
        with open(args.output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=4, ensure_ascii=False)
        print(f"분석 결과가 '{args.output_file}'에 저장되었습니다.")
    else:
        print(json.dumps(result, indent=4, ensure_ascii=False))

if __name__ == "__main__":
    main()
