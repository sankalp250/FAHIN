#!/bin/bash
# FAHIN — Dataset Download Helper
# Requires: kaggle CLI configured (~/.kaggle/kaggle.json)

set -e
mkdir -p ml/data/raw

echo "📥 Downloading Dataset 1: Disease Symptom Description (Kaggle)"
kaggle datasets download -d itachi9604/disease-symptom-description-dataset -p ml/data/raw/
unzip -o ml/data/raw/disease-symptom-description-dataset.zip -d ml/data/raw/disease_symptom/

echo "📥 Downloading Dataset 2: Symptom2Disease (Kaggle)"
kaggle datasets download -d niyarrbarman/symptom2disease -p ml/data/raw/
unzip -o ml/data/raw/symptom2disease.zip -d ml/data/raw/symptom2disease/

echo "📥 Downloading Dataset 3: CDC FluView (public)"
curl -L "https://data.cdc.gov/api/views/9bhg-hcku/rows.csv?accessType=DOWNLOAD" \
  -o ml/data/raw/cdc_flu_weekly.csv

echo "📥 Downloading Dataset 4: Air Quality India (Kaggle)"
kaggle datasets download -d rohanrao/air-quality-data-in-india -p ml/data/raw/

echo ""
echo "✅ All datasets downloaded to ml/data/raw/"
echo ""
echo "NOTE: MIMIC-IV requires credentialed access:"
echo "  1. Complete CITI training at https://physionet.org/about/citi-course/"
echo "  2. Request access at https://physionet.org/content/mimiciv/"
echo "  3. Download with: wget --user=YOUR_USERNAME --ask-password \\"
echo "     https://physionet.org/files/mimiciv/2.2/hosp/admissions.csv.gz"
