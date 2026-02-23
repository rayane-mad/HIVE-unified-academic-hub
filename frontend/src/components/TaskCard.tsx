import { Calendar, Clock, FileText, Megaphone, Video } from 'lucide-react';

interface TaskCardProps {
  task: any;
  onClick: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const getIcon = () => {
    switch (task.type) {
      case 'assignment':
        return <FileText size={20} />;
      case 'event':
        return <Calendar size={20} />;
      case 'announcement':
        return <Megaphone size={20} />;
      default:
        return <FileText size={20} />;
    }
  };

  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-amber-500';
      case 'low':
        return 'border-l-gray-400';
      default:
        return 'border-l-gray-300';
    }
  };

  const formatDueDate = (date: string) => {
    const dueDate = new Date(date);
    const now = new Date();
    const diffHours = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    // For events, don't show "Overdue" - show "Started" or time until
    if (task.type === 'event') {
      if (diffHours < 0) {
        return 'Past';
      } else if (diffHours < 24) {
        return `Starts in ${diffHours}h`;
      } else if (diffDays < 7) {
        return `In ${diffDays}d`;
      } else {
        return dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    }

    // For assignments, show overdue
    if (diffHours < 0) {
      return 'Overdue';
    } else if (diffHours < 24) {
      return `Due in ${diffHours}h`;
    } else if (diffDays < 7) {
      return `Due in ${diffDays}d`;
    } else {
      return dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getDueDateColor = () => {
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    const diffHours = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60));

    if (diffHours < 0) {
      return 'text-red-600 bg-red-50';
    } else if (diffHours < 24) {
      return 'text-red-600 bg-red-50';
    } else if (diffHours < 48) {
      return 'text-amber-600 bg-amber-50';
    } else {
      return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg p-4 shadow-sm border-l-4 ${getPriorityColor()} hover:shadow-md transition-shadow cursor-pointer`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-gray-600">
              {getIcon()}
            </div>
            <h4 className="text-gray-900">{task.title}</h4>
          </div>

          <p className="text-gray-600 mb-3">{task.description}</p>

          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full">
              {task.course}
            </span>
            <span className={`px-3 py-1 rounded-full flex items-center gap-1 ${getDueDateColor()}`}>
              <Clock size={14} />
              {formatDueDate(task.dueDate)}
            </span>
            {task.hasFiles && (
              <span className="text-gray-500 flex items-center gap-1">
                <FileText size={14} />
                Has attachments
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
