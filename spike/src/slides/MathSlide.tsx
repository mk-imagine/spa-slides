import { Fragment } from '@revealjs/react';
import { Slide } from '../lib/Slide';
import { Cite } from '../lib/cite';
import { SlideTitle } from '../lib/layout';
import { TeX } from '../lib/TeX';

export function MathSlide() {
  return (
    <Slide notes="Three fragments of KaTeX. Checks offline math fonts and how fragments export to PDF.">
      <SlideTitle>Logistic regression in three lines</SlideTitle>
      <Fragment as="div" className="eq-row">
        <span className="eq-label">Model</span>
        <TeX block>{String.raw`\hat{y} = \sigma(\mathbf{w}^\top \mathbf{x} + b), \qquad \sigma(z) = \frac{1}{1 + e^{-z}}`}</TeX>
      </Fragment>
      <Fragment as="div" className="eq-row">
        <span className="eq-label">Loss</span>
        <TeX block>{String.raw`\mathcal{L} = -\frac{1}{n}\sum_{i=1}^{n} \big[\, y_i \log \hat{y}_i + (1 - y_i)\log(1 - \hat{y}_i) \,\big]`}</TeX>
      </Fragment>
      <Fragment as="div" className="eq-row">
        <span className="eq-label">Update</span>
        <TeX block>{String.raw`\mathbf{w} \leftarrow \mathbf{w} - \frac{\eta}{n}\sum_{i=1}^{n} (\hat{y}_i - y_i)\,\mathbf{x}_i`}</TeX>
      </Fragment>
      <p className="caption">
        Logistic model: <Cite id="cox1958" />. Gradient-based learning in neural networks: <Cite id="rumelhart1986" />.
      </p>
    </Slide>
  );
}
