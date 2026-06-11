import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
          <div className="bg-white rounded-xl p-8 shadow-lg max-w-md text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-[#E74C3C]" />
            </div>
            <h2 className="text-xl font-bold text-[#1E3A5F] mb-2">页面出错了</h2>
            <p className="text-sm text-gray-500 mb-6">
              {this.state.error?.message || '发生了未知错误，请刷新页面重试。'}
            </p>
            <button
              onClick={this.handleReset}
              className="px-6 py-2 bg-[#1E3A5F] text-white rounded-lg hover:bg-[#162d4a] transition-colors"
            >
              重新尝试
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
