export interface AcademicContentData {
  title: string;
  description: string;
  publishedAt: Date;
  tags: string[];
  draft: boolean;
  category: string;
  status?: string;
}

export interface AcademicContent<TData extends AcademicContentData = AcademicContentData> {
  id: string;
  data: TData;
}

export interface ContentFilters {
  category?: string;
  status?: string;
  tag?: string;
}

export interface ContentFilterOptions {
  categories: string[];
  statuses: string[];
  tags: string[];
}

export interface AdjacentContent<T extends AcademicContent> {
  older: T | null;
  newer: T | null;
}

const collator = new Intl.Collator("pt-BR", { sensitivity: "base" });

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("pt-BR");
}

function publicationTime(entry: AcademicContent): number {
  const timestamp = entry.data.publishedAt.getTime();

  if (!Number.isFinite(timestamp)) {
    throw new TypeError(`Data de publicação inválida para o conteúdo "${entry.id}".`);
  }

  return timestamp;
}

export function selectPublishedContent<T extends AcademicContent>(entries: readonly T[]): T[] {
  return entries
    .filter(({ data }) => !data.draft)
    .toSorted((left, right) => {
      const dateDifference = publicationTime(right) - publicationTime(left);
      return dateDifference || collator.compare(left.id, right.id);
    });
}

export function filterContent<T extends AcademicContent>(
  entries: readonly T[],
  filters: ContentFilters,
): T[] {
  const category = filters.category ? normalize(filters.category) : null;
  const status = filters.status ? normalize(filters.status) : null;
  const tag = filters.tag ? normalize(filters.tag) : null;

  return selectPublishedContent(entries).filter(({ data }) => {
    const matchesCategory = category === null || normalize(data.category) === category;
    const matchesStatus = status === null || (data.status !== undefined && normalize(data.status) === status);
    const matchesTag = tag === null || data.tags.some((candidate) => normalize(candidate) === tag);

    return matchesCategory && matchesStatus && matchesTag;
  });
}

export function collectFilterOptions(entries: readonly AcademicContent[]): ContentFilterOptions {
  const published = selectPublishedContent(entries);
  const uniqueSorted = (values: string[]): string[] =>
    [...new Map(values.map((value) => [normalize(value), value])).values()].toSorted(collator.compare);

  return {
    categories: uniqueSorted(published.map(({ data }) => data.category)),
    statuses: uniqueSorted(
      published.flatMap(({ data }) => (data.status === undefined ? [] : [data.status])),
    ),
    tags: uniqueSorted(published.flatMap(({ data }) => data.tags)),
  };
}

export function getAdjacentContent<T extends AcademicContent>(
  entries: readonly T[],
  currentId: string,
): AdjacentContent<T> {
  const published = selectPublishedContent(entries);
  const index = published.findIndex(({ id }) => id === currentId);

  if (index < 0) {
    return { older: null, newer: null };
  }

  return {
    older: published[index + 1] ?? null,
    newer: published[index - 1] ?? null,
  };
}
