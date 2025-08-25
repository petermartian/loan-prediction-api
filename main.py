# Part 1: Import all the tools we need
import joblib
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel, Field
from enum import Enum

# These "Enum" classes are like creating multiple-choice questions
# so the user can only pick from a specific list of answers.
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


# Part 2: Create our FastAPI app. This is the main "Lego baseplate".
app = FastAPI(title="Loan Prediction API")


# Part 3: Load the robot's "brain" (our model)
# This happens only once when we turn the app on.
model = joblib.load("model.joblib")


# Part 4: Create a "form" for the user to fill out.
# This tells the API exactly what questions to ask.
class LoanApplication(BaseModel):
    Gender: GenderEnum
    Married: MarriedEnum
    Dependents: int = Field(..., ge=0, le=3) # ge=0 means "greater than or equal to 0"
    Education: EducationEnum
    Self_Employed: SelfEmployedEnum
    ApplicantIncome: float
    CoapplicantIncome: float
    LoanAmount: float
    Loan_Amount_Term: float
    Credit_History: float = Field(..., ge=0, le=1) # User can only enter 0 or 1
    Property_Area: PropertyAreaEnum

    class Config:
        use_enum_values = True # Makes sure we use 'Male' instead of 'male'


# Part 5: Create the "prediction button" for our API
@app.post("/predict")
def predict(data: LoanApplication):
    """This is where the magic happens!"""

    # First, we take the user's answers and organize them neatly on a table.
    input_df = pd.DataFrame([data.dict()])

    # Second, we show this table to our model's "brain".
    prediction = model.predict(input_df)

    # We also ask the brain "how sure are you?"
    probability = model.predict_proba(input_df)

    # Finally, we prepare a nice, clean message to send back to the user.
    if prediction[0] == 1:
        status = "Approved"
    else:
        status = "Not Approved"

    return {
        "prediction": int(prediction[0]),
        "status": status,
        "confidence_probability": f"{probability[0][1]:.2%}" # Formats it as a percentage
    }