import pandas as pd

df = pd.read_csv("data/noshow_raw.csv")

print("Shape:", df.shape)

print("\nColumns:")
print(df.columns.tolist())

print("\nNo-show distribution:")
print(df["No-show"].value_counts())

print("\nMissing values:")
print(df.isnull().sum())