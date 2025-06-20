import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

interface WizardQuestion {
  id: string;
  text: string;
  type: 'text' | 'multiple_choice' | 'boolean' | 'number';
  options?: string[];
  required?: boolean;
}

interface WizardProps {
  wizardId: number;
  onComplete: (submissionId: number) => void;
  onCancel: () => void;
}

interface ProgressUpdate {
  task_id: string;
  progress: number;
  status: string;
  error?: boolean;
  download_url?: string;
}

const WizardComponent: React.FC<WizardProps> = ({ wizardId, onComplete, onCancel }) => {
  const [questions, setQuestions] = useState<WizardQuestion[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [clientInfo, setClientInfo] = useState({
    user_email: '',
    agency_name: 'Lear Cyber Tech',
    client_name: ''
  });
  const [reportFormat, setReportFormat] = useState<'excel' | 'word' | 'pdf'>('pdf');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [socket, setSocket] = useState<any>(null);
  const [taskId, setTaskId] = useState<string>('');

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
    setSocket(newSocket);

    // Listen for progress updates
    newSocket.on('task_progress', (data: ProgressUpdate) => {
      if (data.task_id === taskId) {
        setProgress(data.progress);
        setProgressStatus(data.status);
        
        if (data.progress === 100 && !data.error) {
          setSubmitting(false);
          if (data.download_url) {
            // Handle successful completion
            onComplete(parseInt(data.download_url.split('/').pop() || '0'));
          }
        } else if (data.error) {
          setSubmitting(false);
          alert(`Error: ${data.status}`);
        }
      }
    });

    // Load wizard questions
    loadWizardQuestions();

    return () => {
      newSocket.disconnect();
    };
  }, [wizardId, taskId]);

  const loadWizardQuestions = async () => {
    try {
      const response = await fetch(`/api/wizard/wizards/${wizardId}`);
      const data = await response.json();
      setQuestions(data.questions || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load wizard questions:', error);
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setProgress(0);
    setProgressStatus('Submitting wizard...');

    try {
      const response = await fetch(`/api/wizard/wizards/${wizardId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers,
          ...clientInfo,
          report_format: reportFormat
        }),
      });

      const data = await response.json();
      if (data.task_id) {
        setTaskId(data.task_id);
      }
    } catch (error) {
      console.error('Failed to submit wizard:', error);
      setSubmitting(false);
      alert('Failed to submit wizard. Please try again.');
    }
  };

  const renderQuestion = (question: WizardQuestion) => {
    const value = answers[question.id] || '';

    switch (question.type) {
      case 'text':
        return (
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Enter your answer..."
          />
        );

      case 'multiple_choice':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      case 'boolean':
        return (
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name={question.id}
                value="true"
                checked={value === true || value === 'true'}
                onChange={() => handleAnswerChange(question.id, true)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span>Yes</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name={question.id}
                value="false"
                checked={value === false || value === 'false'}
                onChange={() => handleAnswerChange(question.id, false)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span>No</span>
            </label>
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={value}
            onChange={(e) => handleAnswerChange(question.id, parseFloat(e.target.value))}
            placeholder="Enter a number..."
          />
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading wizard...</span>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">No questions available for this wizard.</p>
        <button
          onClick={onCancel}
          className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          Close
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;
  const progressPercentage = ((currentStep + 1) / questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Assessment Wizard</h2>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Step {currentStep + 1} of {questions.length}
        </p>
      </div>

      {/* Client Information (Step 0) */}
      {currentStep === 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Client Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={clientInfo.user_email}
                onChange={(e) => setClientInfo(prev => ({ ...prev, user_email: e.target.value }))}
                placeholder="your.email@company.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client/Company Name *
              </label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={clientInfo.client_name}
                onChange={(e) => setClientInfo(prev => ({ ...prev, client_name: e.target.value }))}
                placeholder="Your Company Name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Report Format
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={reportFormat}
                onChange={(e) => setReportFormat(e.target.value as 'excel' | 'word' | 'pdf')}
              >
                <option value="pdf">PDF Report</option>
                <option value="excel">Excel Report</option>
                <option value="word">Word Report</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Question */}
      {currentStep > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">
            Question {currentStep}
          </h3>
          <p className="text-gray-700 mb-4">{currentQuestion.text}</p>
          {renderQuestion(currentQuestion)}
        </div>
      )}

      {/* Progress Display */}
      {submitting && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">Processing...</span>
            <span className="text-sm text-blue-600">{progress}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-blue-600 mt-2">{progressStatus}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <div>
          {currentStep > 0 && (
            <button
              onClick={handlePrevious}
              disabled={submitting}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
            >
              Previous
            </button>
          )}
        </div>
        
        <div className="space-x-2">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
          >
            Cancel
          </button>
          
          {!isLastStep ? (
            <button
              onClick={handleNext}
              disabled={submitting || (currentStep === 0 && (!clientInfo.user_email || !clientInfo.client_name))}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? 'Processing...' : 'Generate Report'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WizardComponent;

