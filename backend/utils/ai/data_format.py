import json
import re
from typing import List

from models import pg_models, redis_models

def extract_nested_json_and_remaining(text)->str:
    start = text.find('{')
    if start == -1:
        return None, text

    stack = []
    end = start

    for i in range(start, len(text)):
        if text[i] == '{':
            stack.append('{')
        elif text[i] == '}':
            stack.pop()
            if not stack:
                end = i
                break

    if stack:
        return None, text

    return text[start:end + 1]


def parseResponseToJson(input_str: str) -> dict:    
    input_str = re.sub(r"```json|```", "", input_str)
    json_match = extract_nested_json_and_remaining(input_str)

    if json_match:
        try:
            json_data = json.loads(json_match)
            return json_data
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}",input_str)
            return None
    return None


def get_base_formatted_data(
    player: redis_models.Player,
    habits: List[redis_models.Habit],
    tasks: List[redis_models.Task],
    routines: List[redis_models.Routine],
    history: List[pg_models.History] = None,
) -> str:
    def format_habits(habits: List[redis_models.Habit]) -> str:
        if not habits:
            return "No habits found.\n"
        lines = []
        for habit in habits:
            completed = "No"
            if habit.last_completed > habit.start_date:
                completed = "Yes"
            lines.append(
                f"Habit ID: {habit.id}, Name: {habit.name}, Aura: {habit.aura}, start_date: {habit.start_date}, Completed: {completed}, x_occurence: {habit.x_occurence}, occurence: {habit.occurence.value}"
            )
            lines.append(f"  Current Desc: {habit.description}")
        return "\n".join(lines) + "\n"

    def format_tasks(tasks: List[redis_models.Task]) -> str:
        if not tasks:
            return "No tasks found.\n"
        lines = []
        for task in tasks:
            lines.append(
                f"Task ID: {task.id}, Name: {task.name}, Aura: {task.aura}, due_date: {task.due_date}, Completed: {task.completed}"
            )
            lines.append(f"  Current Desc: {task.description}")
        return "\n".join(lines) + "\n"

    def format_routines(routines: List[redis_models.Routine]) -> str:
        if not routines:
            return "No routines found.\n"
        lines = []
        for routine in routines:
            completed = "No"
            if routine.last_completed > routine.start_date:
                completed = "Yes"
            checklist = json.loads(routine.checklist)
            lines.append(
                f"Routine ID: {routine.id}, Name: {routine.name}, aura: {routine.aura}, start_date: {routine.start_date}, Completed: {completed}, x_occurence: {routine.x_occurence},  occurence: {routine.occurence.value}"
            )
            lines.append(f"  Checklist: {checklist}")
            lines.append(f"  Current Desc: {routine.description}")
        return "\n".join(lines) + "\n"

    def format_history(history: List[pg_models.History]) -> str:
        if not history:
            return "No history found.\n"
        lines = []
        history_limit = 50
        for entry in history[-history_limit:]:
            data_summary = (
                str(entry.data)[:100] + "..."
                if entry.data and len(str(entry.data)) > 100
                else str(entry.data)
            )
            lines.append(
                f"{entry.timestamp.strftime('%Y-%m-%d %H:%M')} - Type: {entry.type.name}, Data: {data_summary}, Comment: {entry.comments}"
            )
        return "\n".join(lines) + "\n"

    prompt = f"""
    Here is the context about the player '{player.username}' (Level: {player.level}, Aura: {player.aura}).
    Current Player Description: {player.description}
    Based on the following user profile information:
        - Current Problems: {player.current_problems}
        - Ideal Future: {player.ideal_future}
        - Biggest Fears: {player.biggest_fears}
        - Past Issues (Optional): {player.past_issues}
    --- Habits ---
    {format_habits(habits)}
    --- Tasks ---
    {format_tasks(tasks)}
    --- Routines ---
    {format_routines(routines)}"""
    if history:
        prompt += f"""
        --- History Log (Recent entries first might be better, but currently ASC) ---
        {format_history(history)}
        """
    return prompt
