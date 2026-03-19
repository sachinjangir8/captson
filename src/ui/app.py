"""
Streamlit Deepfake Detection UI
--------------------------------
@python-engineer | @mlops-engineer

Interactive web interface for uploading media and viewing predictions.
Run: streamlit run src/ui/app.py
"""

import os
import sys
import time
import tempfile
from pathlib import Path

import streamlit as st
import requests
import matplotlib.pyplot as plt
import numpy as np

# ── Page config ───────────────────────────────────────────────────────
st.set_page_config(
    page_title="DeepFake Detector",
    page_icon="🔍",
    layout="centered",
    initial_sidebar_state="expanded",
)

API_BASE = os.getenv("API_URL", "http://localhost:8000")

# ── Styling ───────────────────────────────────────────────────────────
st.markdown("""
<style>
.result-fake   { background:#ffeaea; border-left:4px solid #e24b4a; padding:1rem; border-radius:8px; }
.result-real   { background:#eaf3de; border-left:4px solid #639922; padding:1rem; border-radius:8px; }
.metric-card   { background:#f5f5f5; padding:1rem; border-radius:8px; text-align:center; }
.confidence-bar{ height:10px; border-radius:5px; margin-top:4px; }
</style>
""", unsafe_allow_html=True)


# ── Sidebar ───────────────────────────────────────────────────────────
with st.sidebar:
    st.title("⚙️ Settings")
    api_url = st.text_input("API URL", value=API_BASE)

    st.divider()
    st.subheader("About")
    st.markdown("""
    This tool uses a deep learning model to detect AI-generated (deepfake) content.

    **Supported formats:**
    - Videos: `.mp4`, `.avi`, `.mov`
    - Images: `.jpg`, `.jpeg`, `.png`

    **How it works:**
    1. Extracts frames from the video
    2. Detects faces with MTCNN
    3. Runs EfficientNet + LSTM classifier
    4. Aggregates scores into a final prediction
    """)

    st.divider()
    # Health check
    try:
        r = requests.get(f"{api_url}/health", timeout=2)
        if r.status_code == 200 and r.json().get("model_loaded"):
            st.success("API: Connected & model loaded")
        else:
            st.warning("API: Connected but model not loaded")
    except Exception:
        st.error("API: Offline — start the API server first")


# ── Main ──────────────────────────────────────────────────────────────
st.title("🔍 DeepFake Detection System")
st.caption("Upload a video or image to check if it contains AI-generated content.")

uploaded_file = st.file_uploader(
    "Upload media",
    type=["mp4", "avi", "mov", "mkv", "jpg", "jpeg", "png"],
    help="Max 500 MB",
)

if uploaded_file:
    ext = Path(uploaded_file.name).suffix.lower()
    is_video = ext in {".mp4", ".avi", ".mov", ".mkv"}

    # Preview
    col1, col2 = st.columns([1, 1])
    with col1:
        st.subheader("Preview")
        if is_video:
            uploaded_file.seek(0)
            video_bytes = uploaded_file.read()
            st.video(video_bytes)
        else:
            st.image(uploaded_file, use_column_width=True)

    with col2:
        st.subheader("File Info")
        size_mb = uploaded_file.size / (1024 * 1024)
        st.metric("Filename", uploaded_file.name)
        st.metric("Size", f"{size_mb:.1f} MB")
        st.metric("Type", "Video" if is_video else "Image")

    st.divider()

    if st.button("🔍 Analyze for Deepfake", type="primary", use_container_width=True):
        with st.spinner("Analyzing... this may take a moment for longer videos."):
            try:
                uploaded_file.seek(0)
                files = {"file": (uploaded_file.name, uploaded_file, uploaded_file.type)}
                response = requests.post(
                    f"{api_url}/detect-deepfake",
                    files=files,
                    timeout=120,
                )

                if response.status_code == 200:
                    result = response.json()
                    prediction = result["prediction"]
                    confidence = result["confidence"]
                    fake_prob = result["fake_probability"]
                    frame_scores = result.get("frame_scores", [])
                    proc_time = result.get("processing_time_ms", 0)

                    # ── Face Visualization ──────────────────────────
                    if "visualization_frame" in result:
                        st.subheader("Detected Face")

                        frame = np.array(result["visualization_frame"], dtype=np.uint8)

                        st.image(frame, caption="Detected face region", use_column_width=True)

                    # ── Result banner ─────────────────────────────
                    st.subheader("Prediction Result")

                    if prediction == "fake":
                        st.markdown(f"""
                        <div class="result-fake">
                            <h2>⚠️ DEEPFAKE DETECTED</h2>
                            <p>This media appears to be AI-generated or manipulated.</p>
                        </div>
                        """, unsafe_allow_html=True)
                    else:
                        st.markdown(f"""
                        <div class="result-real">
                            <h2>✅ LIKELY AUTHENTIC</h2>
                            <p>This media does not appear to be AI-generated.</p>
                        </div>
                        """, unsafe_allow_html=True)

                    st.write("")

                    # ── Metrics row ────────────────────────────────
                    m1, m2, m3, m4 = st.columns(4)
                    m1.metric("Prediction", prediction.upper())
                    m2.metric("Confidence", f"{confidence:.1%}")
                    m3.metric("Fake probability", f"{fake_prob:.1%}")
                    m4.metric("Process time", f"{proc_time:.0f}ms")

                    # ── Probability gauge ──────────────────────────
                    st.subheader("Fake Probability Score")
                    st.progress(fake_prob)
                    st.caption(f"0% (definitely real) ←→ 100% (definitely fake)  |  Score: {fake_prob:.1%}")

                    # ── Frame-level chart ──────────────────────────
                    if len(frame_scores) > 1:
                        st.subheader("Per-frame Analysis")
                        fig, ax = plt.subplots(figsize=(8, 3))
                        colors = ["#e24b4a" if s >= 0.5 else "#639922" for s in frame_scores]
                        ax.bar(range(len(frame_scores)), frame_scores, color=colors, alpha=0.8, width=0.7)
                        ax.axhline(0.5, color="#888", linestyle="--", lw=1, label="threshold (0.5)")
                        ax.set_xlabel("Frame index")
                        ax.set_ylabel("Fake probability")
                        ax.set_ylim(0, 1)
                        ax.legend(fontsize=9)
                        ax.set_title("Frame-level deepfake scores")
                        plt.tight_layout()
                        st.pyplot(fig)
                        plt.close()

                    # ── Raw JSON ───────────────────────────────────
                    with st.expander("Raw API response"):
                        st.json(result)

                elif response.status_code == 503:
                    st.error("Model not loaded. Train a model and ensure the checkpoint exists.")
                else:
                    st.error(f"API Error {response.status_code}: {response.text}")

            except requests.exceptions.ConnectionError:
                st.error(f"Cannot connect to API at {api_url}. Is the server running?")
            except Exception as e:
                st.error(f"Unexpected error: {e}")


# ── Footer ────────────────────────────────────────────────────────────
st.divider()
st.caption("DeepFake Detection System • Built with PyTorch, FastAPI & Streamlit")
