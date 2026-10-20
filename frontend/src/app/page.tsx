export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-4 px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">POC</p>
      <h1 className="text-4xl font-bold tracking-tight">Document Repository</h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">
        Upload, version and search corporate documents such as policies, reports and technical
        docs.
      </p>
    </main>
  );
}
