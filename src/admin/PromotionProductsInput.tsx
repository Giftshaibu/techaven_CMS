import { forwardRef, useEffect, useState } from "react";
import { usesRailProducts } from "../utils/promotion";
import { useField } from "@strapi/admin/strapi-admin";
import { useFetchClient } from "@strapi/strapi/admin";

type Product = {
  externalId: string;
  name: string;
  shopNames?: string;
  category?: string;
  active: boolean;
};

type Props = {
  name: string;
  value?: string[] | null;
  disabled?: boolean;
  error?: string;
  onChange: (event: { target: { name: string; value: string[]; type: "json" } }) => void;
};

const endpoint = "/content-manager/collection-types/api::external-product.external-product";
const empty: string[] = [];

export default forwardRef<HTMLInputElement, Props>(function PromotionProductsInput(
  { name, value, disabled, error, onChange }, ref,
) {
  const selected = Array.isArray(value) ? value : empty;
  const { value: layout } = useField<string>("layout");
  const { value: useParticipatingOffers } = useField<boolean>("useParticipatingOffers");
  const { get } = useFetchClient();
  const [search, setSearch] = useState("");
  const [shop, setShop] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [details, setDetails] = useState<Record<string, Product>>({});
  const [failure, setFailure] = useState(false);
  const [dragged, setDragged] = useState<number | null>(null);

  useEffect(() => {
    if (!usesRailProducts(layout) || useParticipatingOffers) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const params = new URLSearchParams({
        "filters[active][$eq]": "true",
        page: String(page),
        pageSize: "25",
        sort: "name:asc",
      });
      if (search.trim()) {
        ["name", "shopNames", "slug"].forEach((field, index) =>
          params.set(`filters[$or][${index}][${field}][$containsi]`, search.trim()),
        );
      }
      if (shop.trim()) params.set("filters[shopNames][$containsi]", shop.trim());
      if (category.trim()) params.set("filters[category][$containsi]", category.trim());

      const selectedParams = new URLSearchParams({ pageSize: "12" });
      selected.forEach((id, index) => selectedParams.set(`filters[externalId][$in][${index}]`, id));
      try {
        const [results, saved] = await Promise.all([
          get<{ results: Product[]; pagination: { pageCount: number } }>(`${endpoint}?${params}`),
          selected.length ? get<{ results: Product[] }>(`${endpoint}?${selectedParams}`) : null,
        ]);
        if (cancelled) return;
        setProducts(results.data.results);
        setPageCount(results.data.pagination.pageCount);
        setDetails(Object.fromEntries((saved?.data.results ?? []).map((item) => [item.externalId, item])));
        setFailure(false);
      } catch {
        if (!cancelled) {
          setProducts([]);
          setFailure(true);
        }
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [get, layout, selected, search, shop, category, page, useParticipatingOffers]);

  const update = (ids: string[]) => onChange({ target: { name, value: ids, type: "json" } });
  const move = (from: number, to: number) => {
    if (disabled || to < 0 || to >= selected.length || from === to) return;
    const reordered = [...selected];
    const [id] = reordered.splice(from, 1);
    reordered.splice(to, 0, id);
    update(reordered);
  };

  const description = (product: Product) =>
    [product.name, product.shopNames, product.category, product.active ? "Active" : "Inactive"]
      .filter(Boolean).join(" · ");

  if (!usesRailProducts(layout)) return null;
  if (useParticipatingOffers) return (
    <p>Shop participation is enabled. Publish this promotion, then use Promotions in the staff portal to select shop offers or review seller requests. Only approved, available offers appear on the storefront.</p>
  );

  return (
    <fieldset disabled={disabled} style={{ display: "grid", gap: 8 }}>
      <legend>Rail products</legend>
      <p>These are catalogue models shared by sellers. To feature specific participating shops, enable useParticipatingOffers and manage their offers in the staff portal.</p>
      <label>
        Search products
        <input ref={ref} value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
      </label>
      <label>
        Filter by shop
        <input value={shop} onChange={(event) => { setShop(event.target.value); setPage(1); }} />
      </label>
      <label>
        Filter by category
        <input value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} />
      </label>
      <label>
        Add an active product
        <select
          value=""
          disabled={disabled || selected.length >= 12}
          onChange={(event) => {
            const id = event.target.value;
            if (id && !selected.includes(id)) update([...selected, id]);
          }}
        >
          <option value="">Choose a product</option>
          {products.filter((product) => !selected.includes(product.externalId)).map((product) => (
            <option key={product.externalId} value={product.externalId}>{description(product)}</option>
          ))}
        </select>
      </label>
      {pageCount > 1 && (
        <div>
          <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous results</button>{" "}
          <button type="button" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>Next results</button>
        </div>
      )}
      <ol aria-label="Selected rail products">
        {selected.map((id, index) => {
          const product = details[id] ?? products.find((item) => item.externalId === id);
          return (
            <li
              key={id}
              draggable={!disabled}
              onDragStart={() => setDragged(index)}
              onDragEnd={() => setDragged(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                if (dragged !== null) move(dragged, index);
                setDragged(null);
              }}
            >
              {product ? description(product) : id}{" "}
              <button type="button" disabled={index === 0} onClick={() => move(index, index - 1)}>Move up</button>{" "}
              <button type="button" disabled={index === selected.length - 1} onClick={() => move(index, index + 1)}>Move down</button>{" "}
              <button type="button" onClick={() => update(selected.filter((entry) => entry !== id))}>Remove</button>
            </li>
          );
        })}
      </ol>
      {failure && <p role="alert">Could not load the catalog. Check your External Product read access and try again.</p>}
      {error && <p role="alert">{error}</p>}
    </fieldset>
  );
});
