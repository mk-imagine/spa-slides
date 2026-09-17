import { scaleLinear, scaleLog, type ScaleContinuousNumeric } from 'd3-scale';

export interface AxisSpec {
  domain: [number, number];
  /** `log` for quantities spread over powers of ten. Default `linear`. */
  type?: 'linear' | 'log';
  /** Extend the domain to round tick values. Default false: the domain is exactly what you give. */
  nice?: boolean;
}

export type Scale = ScaleContinuousNumeric<number, number>;

export function makeScale(spec: AxisSpec, range: [number, number]): Scale {
  const [lo, hi] = spec.domain;
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo === hi) {
    throw new Error(`[spa-slides] axis domain must be two different finite numbers, got [${lo}, ${hi}]`);
  }
  if (spec.type === 'log' && (lo <= 0 || hi <= 0)) {
    throw new Error(`[spa-slides] a log axis needs a positive domain, got [${lo}, ${hi}]`);
  }
  const scale: Scale = spec.type === 'log' ? scaleLog().domain(spec.domain).range(range) : scaleLinear().domain(spec.domain).range(range);
  return spec.nice ? scale.nice() : scale;
}

const numberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

/** Default tick label: thousands grouped, at most two decimals. */
export const formatNumber = (value: number) => numberFormat.format(value);
