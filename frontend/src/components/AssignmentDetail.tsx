import { useState } from 'react';
import { ArrowLeft, Calendar, Clock, FileText, Upload, Send, Paperclip, X } from 'lucide-react';

interface AssignmentDetailProps {
  assignment: any;
  onBack: () => void;
}

export function AssignmentDetail({ assignment, onBack }: AssignmentDetailProps) {
  const [submissionText, setSubmissionText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showSubmitSection, setShowSubmitSection] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles([...selectedFiles, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      if (!submissionText && selectedFiles.length === 0) {
        return alert("Please enter text or select a file to submit");
      }

      const token = localStorage.getItem('token');
      const courseId = assignment.course_id;
      if (!courseId) {
        alert("Error: Course ID missing from assignment data. Cannot submit.");
        return;
      }

      // Append file names to text to ensure non-empty body and ack files
      let finalBody = submissionText;
      if (selectedFiles.length > 0) {
        finalBody += `\n\n[Attached Files: ${selectedFiles.map(f => f.name).join(', ')}]`;
      }

      // Fallback if still empty (shouldn't happen with validation)
      if (!finalBody.trim()) finalBody = "[Empty Submission]";

      const res = await fetch(`/api/assignments/submit/${assignment.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          course_id: courseId,
          submission_text: finalBody,
          // file_url: ... (later)
        })
      });

      const data = await res.json();

      if (data.success) {
        alert('Assignment submitted successfully to Canvas! 🚀');
        setShowSubmitSection(false);
        setSubmissionText('');
        setSelectedFiles([]);
      } else {
        alert('Submission Failed: ' + data.error);
      }

    } catch (err) {
      console.error(err);
      alert('Error submitting assignment');
    }
  };

  const formatDueDate = (date: string) => {
    if (!date) return 'No date specified';

    try {
      const parsedDate = new Date(date);

      // Check if date is valid
      if (isNaN(parsedDate.getTime())) {
        return 'Invalid date';
      }

      return parsedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Date parsing error:', date, error);
      return 'Invalid date';
    }
  };

  const getPriorityBadge = () => {
    const colors = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-amber-100 text-amber-700',
      low: 'bg-gray-100 text-gray-700'
    };
    return colors[assignment.priority as keyof typeof colors];
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} />
        Back to Dashboard
      </button>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-gray-900">{assignment.title}</h2>
              <span className={`px-3 py-1 rounded-full ${getPriorityBadge()}`}>
                {assignment.priority} priority
              </span>
            </div>
            <div className="flex items-center gap-4 text-gray-600">
              <span className="flex items-center gap-2">
                <FileText size={18} />
                {assignment.course}
              </span>
              <span className="flex items-center gap-2">
                <Calendar size={18} />
                Due: {formatDueDate(assignment.dueDate)}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4 mt-4">
          <h3 className="text-gray-900 mb-3">Description</h3>
          <p className="text-gray-700 mb-4">{assignment.description}</p>
          <p className="text-gray-700">
            This assignment requires you to demonstrate your understanding of the core concepts covered in recent lectures.
            Please ensure your submission is well-organized and includes all required components. You may work individually
            or in groups of up to 3 students. All group members must be listed on the submission.
          </p>
        </div>

        {assignment.hasFiles && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-gray-900 mb-3">Attachments</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                <FileText size={20} className="text-amber-600" />
                <span className="text-gray-700">assignment_instructions.pdf</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                <FileText size={20} className="text-amber-600" />
                <span className="text-gray-700">dataset.csv</span>
              </div>
            </div>
          </div>
        )}

        {assignment.type === 'assignment' && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <button
              onClick={() => setShowSubmitSection(!showSubmitSection)}
              className="w-full bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
            >
              <Send size={20} />
              {showSubmitSection ? 'Hide Submission' : 'Submit Assignment'}
            </button>
          </div>
        )}
      </div>

      {showSubmitSection && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-gray-900 mb-4">Submit Your Work</h3>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Text Submission (Optional)</label>
            <textarea
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[150px]"
              placeholder="Enter your submission text here..."
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">File Upload</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto mb-3 text-gray-400" size={32} />
              <p className="text-gray-600 mb-2">Drop files here or click to browse</p>
              <p className="text-gray-500 mb-4">Supported formats: PDF, DOCX, TXT (Max 10MB)</p>
              <label className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer">
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.docx,.txt"
                />
                Select Files
              </label>
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Selected Files</label>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Paperclip size={18} className="text-amber-600" />
                      <span className="text-gray-700">{file.name}</span>
                      <span className="text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={selectedFiles.length === 0 && !submissionText}
              className="flex-1 bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Send size={20} />
              Submit Assignment
            </button>
            <button
              onClick={() => setShowSubmitSection(false)}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
