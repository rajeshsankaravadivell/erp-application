export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-4 py-6 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            ERP Dashboard
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Welcome, User</span>
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Sales Overview
              </h2>
              <div className="text-3xl font-bold text-blue-600">
                $124,500
              </div>
              <p className="text-sm text-gray-500 mt-2">
                +12.5% from last month
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Inventory Status
              </h2>
              <div className="text-3xl font-bold text-green-600">
                1,240 Items
              </div>
              <p className="text-sm text-gray-500 mt-2">
                23 items low stock
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Purchase Orders
              </h2>
              <div className="text-3xl font-bold text-purple-600">
                45
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Pending approval
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Recent Orders
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Order #1001</span>
                  <span className="text-green-600">$2,450</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Order #1002</span>
                  <span className="text-red-600">$1,890</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Order #1003</span>
                  <span className="text-blue-600">$3,200</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                System Alerts
              </h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Low stock alert: Product A
                    </p>
                    <p className="text-xs text-gray-500">
                      5 minutes ago
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Payment overdue: Customer B
                    </p>
                    <p className="text-xs text-gray-500">
                      2 hours ago
                    </p>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
