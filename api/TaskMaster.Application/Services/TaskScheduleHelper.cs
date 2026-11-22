using TaskMaster.Domain.Entities;
using TaskMaster.Domain.Enums;

namespace TaskMaster.Application.Services;

public static class TaskScheduleHelper
{
    public static bool IsExpectedOn(TaskItem task, DateOnly date)
    {
        if (!task.IsActive)
            return false;

        return task.Type switch
        {
            TaskType.oneDay => date == DateOnly.FromDateTime(task.CreatedAtUtc),
            TaskType.SpecificDate => task.SpecificDate.HasValue && task.SpecificDate.Value == date,
            TaskType.Recurring => IsRecurringOn(task, date),
            _ => false
        };
    }

    private static bool IsRecurringOn(TaskItem task, DateOnly date)
    {
        // Only count from the day the task was created onward
        var created = DateOnly.FromDateTime(task.CreatedAtUtc);
        if (date < created)
            return false;

        return task.RecurrenceType switch
        {
            RecurrenceType.Daily => true,
            RecurrenceType.Weekdays => date.DayOfWeek is >= DayOfWeek.Monday and <= DayOfWeek.Friday,
            RecurrenceType.Weekly => date.DayOfWeek == created.DayOfWeek,
            _ => false
        };
    }
}