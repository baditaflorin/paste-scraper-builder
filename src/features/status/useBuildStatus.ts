import { useQuery } from '@tanstack/react-query'

interface BuildMeta {
  version: string
  commit: string
  generatedAt: string
  repository: string
  paypal: string
}

interface GitHubCommit {
  sha: string
}

const fallbackMeta: BuildMeta = {
  version: __APP_VERSION__,
  commit: __BUILD_COMMIT__,
  generatedAt: '',
  repository: __REPOSITORY_URL__,
  paypal: __PAYPAL_URL__,
}

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }
  return (await response.json()) as T
}

export const useBuildStatus = () => {
  const meta = useQuery({
    queryKey: ['build-meta'],
    queryFn: () => fetchJson<BuildMeta>(`${import.meta.env.BASE_URL}data/build-meta.json`),
    staleTime: Number.POSITIVE_INFINITY,
  })

  const commit = useQuery({
    queryKey: ['github-main-commit'],
    queryFn: () =>
      fetchJson<GitHubCommit>('https://api.github.com/repos/baditaflorin/paste-scraper-builder/commits/main'),
    staleTime: 60_000,
    retry: 1,
  })

  return {
    meta: meta.data ?? fallbackMeta,
    liveCommit: commit.data?.sha.slice(0, 12) ?? meta.data?.commit ?? fallbackMeta.commit,
    isLoading: meta.isLoading || commit.isLoading,
  }
}
