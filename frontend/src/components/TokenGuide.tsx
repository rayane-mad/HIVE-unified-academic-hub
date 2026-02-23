import { ArrowLeft, ExternalLink, Key, CheckCircle, AlertCircle } from 'lucide-react';

interface TokenGuideProps {
    onBack: () => void;
}

export function TokenGuide({ onBack }: TokenGuideProps) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-white hover:text-amber-100 transition-colors mb-4"
                    >
                        <ArrowLeft size={20} />
                        Back
                    </button>
                    <div className="bg-white rounded-2xl shadow-2xl p-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-amber-100 rounded-lg">
                                <Key className="text-amber-600" size={32} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Token Setup Guide</h1>
                                <p className="text-gray-600">Learn how to connect your accounts to Hive</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Canvas Guide */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">📚</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Canvas LMS</h2>
                            <p className="text-gray-600">Al Akhawayn University</p>
                        </div>
                    </div>

                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex gap-2 items-start">
                            <AlertCircle size={20} className="text-blue-600 mt-0.5" />
                            <div className="text-sm text-blue-800">
                                <p className="font-semibold mb-1">Why use a token?</p>
                                <p>Canvas doesn't allow students to create OAuth apps. Personal Access Tokens are the recommended method for individual projects and never expire unless you revoke them.</p>
                            </div>
                        </div>
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <CheckCircle size={18} className="text-green-600" />
                        Step-by-Step Instructions
                    </h3>

                    <ol className="space-y-4 mb-6">
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                            <div>
                                <p className="font-medium text-gray-900">Open Canvas Settings</p>
                                <p className="text-gray-600 text-sm">Go to your Canvas profile by clicking your avatar (top left) → Settings</p>
                                <a
                                    href="https://aui.instructure.com/profile/settings"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 mt-2 text-amber-600 hover:text-amber-700 text-sm font-medium"
                                >
                                    Open Canvas Settings <ExternalLink size={14} />
                                </a>
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                            <div>
                                <p className="font-medium text-gray-900">Find "Approved Integrations"</p>
                                <p className="text-gray-600 text-sm">Scroll down to the "Approved Integrations" section</p>
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                            <div>
                                <p className="font-medium text-gray-900">Create New Token</p>
                                <p className="text-gray-600 text-sm">Click the "+ New Access Token" button</p>
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                            <div>
                                <p className="font-medium text-gray-900">Configure Token</p>
                                <p className="text-gray-600 text-sm mb-2">Enter the following details:</p>
                                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                                    <li>• <strong>Purpose:</strong> "Hive Academic Hub" (or any description)</li>
                                    <li>• <strong>Expires:</strong> Leave blank (never expires)</li>
                                </ul>
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center text-sm font-bold">5</span>
                            <div>
                                <p className="font-medium text-gray-900">Copy the Token</p>
                                <p className="text-gray-600 text-sm">Click "Generate Token" and <strong>immediately copy it</strong> - you won't be able to see it again!</p>
                                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                                    ⚠️ The token will look like: <code className="bg-yellow-100 px-1 rounded">1234~AbCdEf...</code>
                                </div>
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center text-sm font-bold">6</span>
                            <div>
                                <p className="font-medium text-gray-900">Paste in Hive</p>
                                <p className="text-gray-600 text-sm">Return to Hive, click "Paste Token" under Canvas, and save</p>
                            </div>
                        </li>
                    </ol>

                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                            <strong>Security Note:</strong> Your token is stored securely and only used to fetch your Canvas data. You can revoke it anytime from Canvas settings.
                        </p>
                    </div>
                </div>

                {/* Google & Outlook are OAuth - just note it */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Google Calendar & Outlook</h2>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                            <strong>✅ Good News!</strong> These platforms use automatic OAuth 2.0 - just click "Connect (Auto)" and authorize. No manual token needed!
                        </p>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <button
                        onClick={onBack}
                        className="px-6 py-3 bg-white text-amber-600 rounded-lg hover:bg-amber-50 transition-colors font-medium shadow-lg"
                    >
                        Back to Connections
                    </button>
                </div>
            </div>
        </div>
    );
}
