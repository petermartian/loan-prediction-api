# Part 1: Import all the tools we need
import joblib
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel, Field
from enum import Enum
from fastapi.middleware.cors import CORSMiddleware # Import the CORS middleware

# --- Enums for categorical features ---
class GenderEnum(str, Enum):
    male = 'Male'
    female = 'Female'

class MarriedEnum(str, Enum):
    yes = 'Yes'
    no = 'No'

class EducationEnum(str, Enum):
    graduate = 'Graduate'
    not_graduate = 'Not Graduate'

class SelfEmployedEnum(str, Enum):
    yes = 'Yes'
    no = 'No'

class PropertyAreaEnum(str, Enum):
    rural = 'Rural'
    urban = 'Urban'
    semiurban = 'Semiurban'

# Part 2: Create our FastAPI app
app = FastAPI(title="Loan Prediction API")

# --- THIS IS THE UPDATED PART ---
# Add the URL of your new Netlify frontend to this list
origins = [
    "http://localhost",
    "http://localhost:5173",
    "https://loanapi-prediction.netlify.app", # Your live frontend URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # Allows specific origins
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods (GET, POST, etc.)
    allow_headers=["*"], # Allows all headers
)
# -----------------------------------------

# Part 3: Load the model
model = joblib.load("model.joblib")

# Part 4: Define the request data model
class LoanApplication(BaseModel):
    Gender: GenderEnum
    Married: MarriedEnum
    Dependents: int = Field(..., ge=0, le=3)
    Education: EducationEnum
    Self_Employed: SelfEmployedEnum
    ApplicantIncome: float
    CoapplicantIncome: float
    LoanAmount: float
    Loan_Amount_Term: float
    Credit_History: float = Field(..., ge=0, le=1)
    Property_Area: PropertyAreaEnum

    class Config:
        use_enum_values = True

# Part 5: Create the prediction endpoint
@app.post("/predict")
def predict(data: LoanApplication):
    """This is where the magic happens!"""
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

# Part 6: Create the root endpoint
@app.get("/")
def read_root():
    """This function runs when someone visits the main page."""
    return {"message": "Welcome to the Loan Prediction API. Go to /docs to use the API."}
