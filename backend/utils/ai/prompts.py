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

def get_chat_prompt(
    base_prompt: str,
    mentor:str
) -> str:
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
        All the keys and string values are enclosed in double quotes.
        Use true and false for booleans instead of True or False.
        Include arrays properly without treating them as strings.
        Maintain proper commas, braces, and other JSON formatting conventions.
    No surrounding text, do not reply with anything except a ***JSON object***.
    """
    prompt += f"Talk like you are {mentor}."
    return prompt

def get_daily_summary_prompt(
    base_prompt: str,
    mentor:str
) -> str:

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
    - Small lines separated by fullstops, *no other punctuation in the entire string*.
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
        - Goals in Life: {profile_data.get("goals_in_life", "Not provided")}
        - Ideal Future: {profile_data.get("ideal_future", "Not provided")}
        - Biggest Fears: {profile_data.get("biggest_fears", "Not provided")}
        - Past Issues (Optional): {profile_data.get("past_issues", "Not provided")}
    """
    prompt+= """Generate a list of suggested Tasks, Habits, and Routines to help the user achieve their goals and overcome their problems. 
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