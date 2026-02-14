import RepoInput from "@/components/RepoInput";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-text-primary mb-3">
          Codebase Explainer
        </h1>
        <p className="text-lg text-text-secondary max-w-md">
          Paste a GitHub repo URL and get plain-English explanations of every
          folder and file — no coding knowledge needed.
        </p>
      </div>
      <RepoInput />
      <p className="mt-8 text-sm text-text-muted max-w-sm text-center">
        Works with any public GitHub repository. Add a token for private repos.
      </p>
    </div>
  );
}
