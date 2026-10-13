import rows from './playbook.json';

export const POSTURES = ['discloser', 'recipient', 'balanced'];

export function playbookFor(posture) {
  return rows
    .filter(r => r.posture === posture || r.posture === 'all')
    .map(({ posture: _p, ...r }) => r);
}
