# Banner images and shop promotions

For a banner rail, set `desktopBackground` and `mobileBackground` to the intended artwork, save, then publish the promotion. The storefront prefers `desktopBackground`, with legacy strip artwork as a fallback.

To feature actual shops' offers, enable `useParticipatingOffers` on a banner rail, side rail, or square tiles promotion and publish it. Open Promotions in the staff portal to select a shop's available offer or review seller requests. Sellers can request participation under Promotions in their own portal. Only approved, available offers appear on the storefront.

The regular external product picker selects catalogue models shared by sellers. It continues to work for promotions with `useParticipatingOffers` disabled. Participating campaigns use the commerce offer selection instead of that picker.

Deploy the matching commerce API migration and storefront changes before enabling participation. Rebuild and restart the CMS after pulling the new field.
