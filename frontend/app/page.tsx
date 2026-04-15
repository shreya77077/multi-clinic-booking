import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center max-w-2xl px-6">
        <h1 className="text-5xl font-bold text-indigo-700 mb-4">
          Multi-Clinic Booking
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Book doctor appointments across multiple clinics — fast, easy, and reliable.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login"
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition">
            Login
          </Link>
          <Link href="/register"
            className="border-2 border-indigo-600 text-indigo-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-50 transition">
            Register
          </Link>
        </div>
      </div>
    </main>
  );
}
