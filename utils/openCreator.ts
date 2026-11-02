type Router = { push: (href: any) => void };

type Source = {
  id: string;
  creatorId?: string;
  creatorName?: string;
  creatorUsername?: string;
};

/** Open a creative's public page. Falls back to the offering page when the feed didn't say who made it. */
export function openCreator(router: Router, item: Source) {
  if (item.creatorId) {
    router.push(`/creator/${item.creatorId}` as any);
    return;
  }
  router.push({
    pathname: '/profile/[id]',
    params: {
      id: item.id,
      creatorId: '',
      creatorName: item.creatorName ?? '',
      creatorUsername: item.creatorUsername ?? '',
    },
  } as any);
}
