export function calculateEnvironment() {
  const { hostname, href } = window.location;

  if (
    hostname === 'www.visualcomfort.com'
    || hostname === 'visualcomfort.com'
    || href.includes('adobe-edge--visualcomfort')
  ) {
    return 'prod';
  }

  if (hostname === 'localhost' || hostname === 'vc-local.test') return 'dev';

  // check for stage subdomain (e.g., stage, stage2, stage3, …)
  const stageSubdomain = hostname.match(/^(stage\d*)\./);
  if (stageSubdomain) return stageSubdomain[1];

  // check for adobe-edge stage pattern in the URL
  const stageEdge = href.match(/(stage\d*)--adobe-edge-stage--visualcomfort/);
  if (stageEdge) return stageEdge[1];

  // if some other branch on adobe-edge-stage use stage
  if (href.includes('adobe-edge-stage--visualcomfort')) {
    return 'stage';
  }

  // Fallback to prod
  return 'prod';
}