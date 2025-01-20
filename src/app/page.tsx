import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <main className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="mb-6 text-4xl font-bold text-gray-900">My Good Day</h1>
          <p className="mb-8 text-xl text-gray-600">
            Track your daily journey to wellness, one entry at a time.
          </p>
        </div>

        <div className="mx-auto max-w-2xl">
          <div className="mb-12 rounded-lg bg-white p-8 shadow-lg">
            <h2 className="mb-4 text-2xl font-semibold text-gray-800">
              Start Tracking Today
            </h2>
            <p className="mb-6 text-gray-600">
              Log your daily food intake and build healthy habits. More tracking
              features coming soon!
            </p>
            <div className="space-y-4">
              <Link
                href="/chat"
                className="block w-full rounded-lg bg-blue-600 px-4 py-3 text-center font-medium text-white transition hover:bg-blue-700"
              >
                Start Food Journal
              </Link>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-600">
                  Coming Soon:
                  <br />
                  • Habit Tracking
                  <br />
                  • Progress Analytics
                  <br />• Custom Goals
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
