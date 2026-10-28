export const SAMPLE_REVIEWS = [
  {
    id: "sample-1",
    tag: "Genuine (Expected)",
    title: "Ergonomic vertical mouse review",
    product: "Logitech MX Master Wireless Mouse",
    rating: 5,
    text: "Very comfortable mouse, fits the hand perfectly, reduced my wrist pain and holds a charge for weeks. Excellent mouse for hand fatigue.",
    explanation: "Contains strong domain-specific honest markers ('mouse', 'hand', 'pain', 'comfortable') that successfully overcome the model's base intercept."
  },
  {
    id: "sample-2",
    tag: "Fake (Spam / Incentivized)",
    title: "AMAZING PRODUCT BEST PURCHASE EVER!!!!",
    product: "Ultra Slim Smart Watch Pro",
    rating: 5,
    text: "This is the best item I have ever bought in my entire life! Wow buy it right now do not hesitate 100% recommended seller is so helpful best best best!",
    explanation: "Superlative, hyperbolic praise with no functional details. Scores ~88% Fake probability."
  },
  {
    id: "sample-3",
    tag: "Genuine (Model False-Positive Risk)",
    title: "Decent budget headphones",
    product: "Sony WH-1000XM4 Wireless Headphones",
    rating: 4,
    text: "Quality sound, good price for my headphones and nice build. Noise cancelling blocks out subway noise easily.",
    explanation: "Demonstrates model domain bias: words like 'quality', 'sound', 'for my' carry positive coefficients in the training set, triggering a false positive (~91% Fake)."
  },
  {
    id: "sample-4",
    tag: "Fake (Incentivized Offer)",
    title: "Free gift card included buy now fast",
    product: "Wireless Fast Charger Dock",
    rating: 5,
    text: "Click link for free discount and money back reward! Product arrived fast and looks good. 5 stars all around great buy.",
    explanation: "Promotional spam patterns typical of fraudulent campaign incentives."
  }
];
