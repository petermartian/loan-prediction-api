# Part 1: Import all the tools we need
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from enum import Enum
from fastapi.middleware.cors import CORSMiddleware  # Import the CORS middleware

# --- Enums for categorical features ---
class GenderEnum(str, Enum):
    male = "Male"
    female = "Female"

class MarriedEnum(str, Enum):
    yes = "Yes"
    no = "No"

class EducationEnum(str, Enum):
    graduate = "Graduate"
    not_graduate = "Not Graduate"

class SelfEmployedEnum(str, Enum):
    yes = "Yes"
    no = "No"

class PropertyAreaEnum(str, Enum):
    rural = "Rural"
    urban = "Urban"
    semiurban = "Semiurban"

# Part 2: Create our FastAPI app
app = FastAPI(title="Loan Prediction API")

# --- Part 2a: Add CORS middleware ---
# This allows your frontend (running on a different URL) to communicate with your backend.
origins = [
    "http://localhost",
    "http://localhost:5173",  # Default Vite dev server port
    "http://localhost:3000",  # Default Create React App port
    # Add the URL of your deployed frontend here if you have one
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Allows specific origins
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],  # Specify allowed methods for security
    allow_headers=["Content-Type", "Authorization"],  # Specify allowed headers
)
# -----------------------------------------

# Part 3: Load the model
try:
    model = joblib.load("model.joblib")
except FileNotFoundError:
    raise HTTPException(status_code=500, detail="Model file 'model.joblib' not found.")

# Part 4: Define the request data model
class LoanApplication(BaseModel):
    Gender: GenderEnum
    Married: MarriedEnum
    Dependents: int = Field(..., ge=0, le=3, description="Number of dependents (0-3)")
    Education: EducationEnum
    Self_Employed: SelfEmployedEnum
    ApplicantIncome: float = Field(..., gt=0, description="Applicant's income in currency units")
    CoapplicantIncome: float = Field(..., ge=0, description="Coapplicant's income in currency units")
    LoanAmount: float = Field(..., gt=0, description="Loan amount in currency units")
    Loan_Amount_Term: float = Field(..., gt=0, description="Loan term in months")
    Credit_History: float = Field(..., ge=0, le=1, description="Credit history (0 or 1)")
    Property_Area: PropertyAreaEnum

    class Config:
        use_enum_values = True

# Part 5: Create the prediction endpoint
@app.post("/predict")
def predict(data: LoanApplication):
    """Endpoint to predict loan approval status.
    Takes a loan application and returns the prediction status and confidence probability."""
    try:
        input_df = pd.DataFrame([data.dict()])
        prediction = model.predict(input_df)
        probability = model.predict_proba(input_df)

        if prediction[0] == 1:
            status = "Approved"
        else:
            status = "Not Approved"

        return {
            "prediction": int(prediction[0]),
            "status": status,
            "confidence_probability": f"{probability[0][1]:.2%}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

# Part 6: Create the root endpoint
@app.get("/")
def read_root():
    """Welcome message for the API root.
    Visit /docs for interactive API documentation."""
    return {"message": "Welcome to the Loan Prediction API. Go to /docs to use the API."}