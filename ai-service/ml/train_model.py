import pandas as pd
import json
import joblib

from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)

from xgboost import XGBClassifier


# -----------------------------------
# 1. Load cleaned dataset
# -----------------------------------

df = pd.read_csv("data/noshow_clean.csv")

with open("feature_columns.json", "r") as f:
    feature_cols = json.load(f)

X = df[feature_cols]
y = df["target"]


# -----------------------------------
# 2. Train/Test Split
# -----------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print("Training samples:", len(X_train))
print("Testing samples:", len(X_test))


# -----------------------------------
# 3. Handle Class Imbalance
# -----------------------------------

pos_weight = (y_train == 0).sum() / (y_train == 1).sum()

print("Scale positive weight:", pos_weight)


# -----------------------------------
# 4. Create XGBoost Model
# -----------------------------------

model = XGBClassifier(
    n_estimators=200,
    max_depth=5,
    learning_rate=0.1,
    scale_pos_weight=pos_weight,
    eval_metric="logloss",
    random_state=42
)


# -----------------------------------
# 5. Train Model
# -----------------------------------

print("\nTraining XGBoost model...")

model.fit(X_train, y_train)

print("Training completed!")


# -----------------------------------
# 6. Make Predictions
# -----------------------------------

y_pred = model.predict(X_test)

y_prob = model.predict_proba(X_test)[:, 1]


# -----------------------------------
# 7. Evaluate Model
# -----------------------------------

precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)
roc_auc = roc_auc_score(y_test, y_prob)

conf_matrix = confusion_matrix(y_test, y_pred)


print("\n========== MODEL RESULTS ==========")

print("\nClassification Report:")
print(classification_report(y_test, y_pred))

print("Precision:", precision)
print("Recall:", recall)
print("F1 Score:", f1)
print("ROC-AUC:", roc_auc)

print("\nConfusion Matrix:")
print(conf_matrix)


# -----------------------------------
# 8. Save Metrics
# -----------------------------------

metrics = {
    "precision": precision,
    "recall": recall,
    "f1_score": f1,
    "roc_auc": roc_auc,
    "confusion_matrix": conf_matrix.tolist()
}

with open("metrics.json", "w") as f:
    json.dump(metrics, f, indent=2)


# -----------------------------------
# 9. Save Model
# -----------------------------------

joblib.dump(model, "noshow_model.pkl")

print("\nModel saved as: noshow_model.pkl")
print("Metrics saved as: metrics.json")