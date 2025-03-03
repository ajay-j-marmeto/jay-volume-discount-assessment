// @ts-check
import { DiscountApplicationStrategy } from "../generated/api";

const EMPTY_DISCOUNT = {
  discountApplicationStrategy: DiscountApplicationStrategy.First,
  discounts: []
};

export function run(input) {
  const volumeDiscounts = input.cart.lines.flatMap((cartLine) => {
    const product = cartLine.merchandise.product;
    const discountConfig = product?.metafield?.value;
    const isEligibleProduct = product?.hasAnyTag;

    if (!discountConfig || !isEligibleProduct) return [];

    try {
      const discountTiers = JSON.parse(discountConfig);
      if (!Array.isArray(discountTiers)) return [];

      const validTiers = discountTiers
        .sort((a, b) => a.quantity - b.quantity)
        .filter(tier => tier.quantity > 0 && tier.discount > 0);

      const applicableTier = validTiers.reduce((best, current) =>
        cartLine.quantity >= current.quantity ? current : best, null);

      if (!applicableTier) return [];

      return [{
        targets: [{ cartLine: { id: cartLine.id } }],
        value: { percentage: { value: applicableTier.discount.toString() } },
        message: applicableTier.message || `${applicableTier.discount}% off for bulk purchase`
      }];
    } catch {
      return [];
    }
  });

  return volumeDiscounts.length > 0
    ? { discounts: volumeDiscounts, discountApplicationStrategy: DiscountApplicationStrategy.First }
    : EMPTY_DISCOUNT;
}