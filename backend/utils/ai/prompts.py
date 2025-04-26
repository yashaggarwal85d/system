from utils.general.get_env import getenv


def get_create_format() -> str:
    return """
    Task - "name": "A string"
           "due_date": "YYYY-MM-DD formated string *date greater than today*"
           "aura": integer 
        Example - {"name": "Buy Groceries", "due_date": "2025-04-16", "aura": 5}
    Habits - "name": "A string"
             "aura": integer 
             "x_occurence": integer (after how much time should the habit be repeated)
             "occurence": "days|weeks|months" (duration of 1 unit to be repeated)
        Example - {"name": "Meditate", "aura": 5, "x_occurence": 3,"occurence": "days"}
    Routine - "name": "A string"
              "aura": integer 
              "x_occurence": integer (after how much time should the routine be repeated)
              "occurence": "days|weeks|months" (duration of 1 unit to be repeated)
              "checklist": [{"id": "uuid1", "text": "Step 1", "completed": false, "level": 0, "children": []}, ...] (children is again a checklist type)
        Example - {"name": "Meditate", "aura": 5, "x_occurence": 3,"occurence": "days", 
                   "checklist": [{"id": "uuid1", "text": "close your eyes", "completed": false, "level": 0, "children": []},
                                  {"id": "uuid2", "text": "Take deep breaths", "completed": false, "level": 0, "children": []}
                                 ]
                }
    """


def get_chat_prompt(base_prompt: str, mentor: str) -> str:
    prompt = base_prompt
    prompt += """
    --- Instructions ---
    From the next prompt onwards user is going to ask you questions or requests about their data.
    Take the instructions provided in this prompt and respond accordingly for the entire conversation:
    1.  **Request analysis:**
        Determine if the user wants to:
        (a) Create Action -  
            Create a new task, habit, or routine. *All the fields are necessary*.
        (b) Edit Action - 
            Edit an existing task, habit, or routine. *Only include the updated fields, id and name*.
        (c) Response Action - 
            Ask a question or request a report/analysis about their data or a follow up question or anything else. *Only Include a message field*
        Model is not allowed to do any action beyond this. If anything does not matches as create or edit action, then it will be a response action
    2. **Prepare Response:**
        """
    prompt += get_create_format()
    prompt += """
    Respond ****ONLY**** with a JSON object containing "{{"action": "create", "type": "task|habit|routine", "details": {{ ... extracted details in specified formats ... }} }}". 
    Examples: 
        (a) - "{{"action": "create", "type": "task", "details": {{"name": "Buy Groceries", "due_date": "2025-04-16"}}}}".
        (b) - "{{"action": "edit", "type": "task", "details": {{"id":"123", "name": "Buy Groceries", "due_date": "2025-04-18"}}}}".
        (c) - "{{"action": "response", "type": "task", "details": {{"message":"I need more info on this"}}}}".
    Can you provide the following information as valid JSON? Please ensure that:
        All the keys and string values are enclosed in *double quotes*.
        Use true and false for booleans instead of True or False.
        Include arrays properly without treating them as strings.
        Maintain proper commas, braces, and other JSON formatting conventions.
    No surrounding text, do not reply with anything except a ***JSON object***.
    """
    prompt += f"Talk like you are {mentor}."
    return prompt


def get_daily_summary_prompt(base_prompt: str, mentor: str) -> str:

    prompt = base_prompt
    prompt += f"""
    
    --- Instructions ---
    Based ONLY on the data provided above:
    1. For EACH Task, Habit, and Routine listed, provide a concise, engaging, and context-aware ai_description 1 sentence, no puntuation. 
    - Analyze the history comments and completion status/dates. 
    - If the item is consistently completed on time or shows improvement, provide a positive/motivational description. 
    - If its often missed or overdue, provide a description that reflects this.
    - Description should sound creative and alive. Use rich vocabulary.
    2. Provide an overall ai_player_summary for the player. This summary should:
    - Small lines separated by fullstops, *no other punctuation in the entire string*. 4 words max per line
    - Include a catchy title or headline for the players current status.
    - Briefly motivate or mock the player based on overall performance patterns.
    - Suggest 1-2 specific, actionable improvements based on patterns (e.g., Focus on completing tasks before their due date, Try breaking down the morning routine).
    - Detect and mention any notable patterns (e.g., Struggles with morning habits, Consistently completes weekly tasks).
    - Summary should sound creative and alive. Use rich vocabulary.
    3. Generate ONE challenge_task suitable for the player based on their data and the patterns identified. This task should push the player slightly outside their comfort zone or address an area needing improvement. Provide:
    - A short, engaging name for the task.
    - A brief description explaining the challenge, 1 line no puntuation.
    - A suggested due_date in **YYYY-MM-DD** format
    - A suggested aura value (integer, e.g., 10, 15, 20) reflecting the challenge level.

    --- Output Format ---
    Provide the output STRICTLY in the following JSON format:
    {{
    "item_descriptions": {{
        "task:<task_id>": "<ai_description for task>",
        "habit:<habit_id>": "<ai_description for habit>",
        "routine:<routine_id>": "<ai_description for routine>",
        ...
    }},
    "ai_player_summary": "Title Line.Motivational/Mocking Line.Suggestion 1.Suggestion 2.Pattern 1.Pattern 2",
    "challenge_task": {{
        "name": "<Generated Task Name>",
        "description": "<Generated Task Description>",
        "due_date": "<Suggested Due Date (e.g., within 3 days)>",
        "aura": <Suggested Aura Value (integer)>
    }}
    }}
    Ensure all descriptions, the summary, and the challenge task are generated SOLELY from the provided data. 
    Do not add external knowledge or advice beyond interpreting the players activity.
    Can you provide the following information as valid JSON? Please ensure that:
        All the keys and string values are enclosed in double quotes.
        Use true and false for booleans instead of True or False.
        Include arrays properly without treating them as strings.
        Maintain proper commas, braces, and other JSON formatting conventions.
    No surrounding text, do not reply with anything except a ***JSON object***.
    """
    prompt += f"Talk like you are {mentor}."
    return prompt


def generate_initial_feed(profile_data: dict, mentor: str) -> str:
    prompt = f"""
        Based on the following user profile information:
        - Current Problems: {profile_data.get("current_problems", "Not provided")}
        - Ideal Future: {profile_data.get("ideal_future", "Not provided")}
        - Biggest Fears: {profile_data.get("biggest_fears", "Not provided")}
        - Past Issues (Optional): {profile_data.get("past_issues", "Not provided")}
    """
    prompt += """Generate a list of suggested Tasks, Habits, and Routines to help the user achieve their goals and overcome their problems. 
                Routine is something that is compulsory and have a structure, a habit is something user builds up on.
                If a detail is missing, unclear or confusing, just reply with a simple text of whats missing, 
                else provide the output strictly in JSON format (no surrounding text) with the following structure:"""
    prompt += get_create_format()
    prompt += """
    Return one JSON object for all tasks, habits, and routines.
    Example: 
        "{"objects":[{"type": "task", "details": {{"name": "Buy Groceries", "due_date": "2025-04-16"}}},
                     {"type": "task", "details": {{"name": "cut veges", "due_date": "2025-04-16"}}}]}".
    Can you provide the following information as valid JSON? Please ensure that:
        All the keys and string values are enclosed in double quotes.
        Use true and false for booleans instead of True or False.
        Include arrays properly without treating them as strings.
        Maintain proper commas, braces, and other JSON formatting conventions.
    No surrounding text, do not reply with anything except a JSON object.
    """
    prompt += f"All the fields are compulsory for each object created. Talk like you are {mentor}."
    return prompt


def get_mentor(message: str) -> str:
    mentors = getenv("MENTORS")
    prompt = f"""Decide one of the following mentors to answer the user prompt: {mentors}. Only reply with the full name of the mentor, no surrounding text. 
                  User message is :{message}"""
    return prompt


def get_finance_data_prompt(data: str) -> str:
    prompt = """
            You are an AI assistant specialized in parsing and cleaning financial transaction data from raw text, typically in CSV format, but potentially other simple text formats.
            Your task is to extract key information from each transaction row provided and return it in a structured JSON format.

            Input Data:
            The input will be a block of text containing transaction data, likely one transaction per line. Common formats include CSV (Comma Separated Values).

            Instructions:
            1.  **Parse Each Row:** Process the input text line by line. Assume the first line might be headers, but also handle cases without headers.
            2.  **Identify Key Columns:** Automatically detect columns representing:
                *   **Date:** Look for dates in various common formats (e.g., YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, YYYY.MM.DD, Month DD, YYYY). Standardize the output date to **YYYY-MM-DD** format.
                *   **Description:** Identify the text describing the transaction. This might be in one or multiple columns. Combine if necessary.
                *   **Amount:** Find the numerical value of the transaction. Handle currency symbols ($, €, £, ₹, etc.) and commas if present.
                *   **Credit/Debit Indicator (Optional):** Look for columns or keywords (e.g., "CR", "DR", "Credit", "Debit", "Income", "Expense", positive/negative signs on amount) indicating whether the transaction is an income (credit) or an expense (debit). If not explicitly found, assume amounts are debits unless context suggests otherwise (e.g., large positive values might be credits).
            3.  **Assign Category:** Based on the transaction description, assign a relevant category from the following list (or suggest 'Other' if unsure):
                *   Food & Dining
                *   Groceries
                *   Transport
                *   Utilities (Electricity, Water, Gas, Internet)
                *   Rent/Mortgage
                *   Shopping (Clothes, Electronics, etc.)
                *   Entertainment (Movies, Events, Hobbies)
                *   Salary/Income
                *   Healthcare/Medical
                *   Insurance
                *   Travel
                *   Education
                *   Personal Care
                *   Gifts & Donations
                *   Investments
                *   Other
            4.  **Determine Credit/Debit:** Set the `is_credit` field to `true` if it's an income/credit, and `false` if it's an expense/debit.
            5.  **Handle Errors:** If the input format is completely unrecognizable, ambiguous, or lacks essential information (like amount or date), do not attempt to process. Instead, return a specific JSON error object: `{"error": "Unsupported format or ambiguous data"}`.
            6.  **Format Output:** Return a single JSON object containing a key "transactions" which holds a list of processed transaction objects. Each transaction object should have the following keys:
                *   `transaction_date`: "YYYY-MM-DD" (string)
                *   `description`: "Transaction description" (string)
                *   `amount`: 123.45 (number, always positive)
                *   `category`: "Assigned Category" (string)
                *   `is_credit`: true/false (boolean)

            Example Input:
            ```
            Date,Description,Amount,Type
            2025-04-25,Coffee Shop,-5.50,DR
            2025/04/24,Salary Deposit,2500.00,CR
            April 23, 2025,"Grocery Store, Main St",-75.20,Debit
            ```

            Example Output (for the above input):
            ```json
            {
            "transactions": [
                {
                "transaction_date": "2025-04-25",
                "description": "Coffee Shop",
                "amount": 5.50,
                "category": "Food & Dining",
                "is_credit": false
                },
                {
                "transaction_date": "2025-04-24",
                "description": "Salary Deposit",
                "amount": 2500.00,
                "category": "Salary/Income",
                "is_credit": true
                },
                {
                "transaction_date": "2025-04-23",
                "description": "Grocery Store, Main St",
                "amount": 75.20,
                "category": "Groceries",
                "is_credit": false
                }
            ]
            }
            ```

            **IMPORTANT:** Respond ONLY with the valid JSON object (either the transaction list or the error object). Do not include any introductory text, explanations, or markdown formatting like ```json ```. Just the raw JSON.
            Here is the data : 
            """
    prompt += data
    return prompt
