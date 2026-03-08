import Link from 'next/link'

export const metadata = {
  title: 'For Students | Thoughtful India',
  description: 'Thoughtful India for students — written by students, for students.',
}

export default function ForStudentsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <hr className="border-stone-200 mb-8" />
      <p className="text-base text-stone-800 leading-relaxed mb-4">
        Hi! We're Rajeshwari and Maya, freshmen at Waubonsie and Neuqua Valley High School.
        We love to write and learn about our Indian culture, so we wanted to do just that for students.
        We've just launched on Instagram! 🙂
      </p>
      <p className="text-base text-stone-800 leading-relaxed">
        Follow Thoughtful India on Instagram here:{' '}
        <a
          href="https://www.instagram.com/th.india/"
          className="text-red-700 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://www.instagram.com/th.india/
        </a>
      </p>
      <hr className="border-stone-200 mt-8" />
    </main>
  )
}
