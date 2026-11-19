import { css, shift } from '../paint/brush.js';

// A spot pressed on with the belly of the brush, then picked up at one edge.
// Its footprint follows the species' marking and the girth of the model at that point.
export function pressSpot(ctx, x, y, radius, pigment, opacity, stretch, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(radius, radius * stretch);
  ctx.fillStyle = css(pigment, opacity);
  ctx.beginPath();
  ctx.moveTo(-0.92, -0.15);
  ctx.bezierCurveTo(-0.8, -0.75, -0.18, -0.9, 0.52, -0.68);
  ctx.quadraticCurveTo(1.0, -0.4, 0.91, 0.22);
  ctx.bezierCurveTo(0.68, 0.89, -0.28, 0.96, -0.78, 0.49);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = css(shift(pigment, 2, -4, 6), opacity * 0.8);
  ctx.beginPath();
  ctx.ellipse(-0.30, -0.46, 0.34, 0.10, -0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
