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
            // CreatedAtUtc can fall on the previous local calendar day near midnight;
            // accept create-day and the next UTC day so "one day" still shows as expected.
            TaskType.oneDay => IsOneDayExpected(task, date),
            TaskType.SpecificDate => task.SpecificDate.HasValue && task.SpecificDate.Value == date,
            TaskType.Recurring => IsRecurringOn(task, date),
            _ => false
        };
    }

    private static bool IsOneDayExpected(TaskItem task, DateOnly date)
    {
        var created = DateOnly.FromDateTime(task.CreatedAtUtc);
        return date == created || date == created.AddDays(1);
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