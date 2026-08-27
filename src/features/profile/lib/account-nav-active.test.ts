/**
 * @file account-nav-active.test.ts
 * @description Unit tests for Mi TruePhone sidebar active-state rules.
 * @dependencies node:test, node:assert/strict, @/features/profile/lib/account-nav-active
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isAccountNavItemActive } from "@/features/profile/lib/account-nav-active";

describe("isAccountNavItemActive", () => {
  it("highlights only Mis anuncios on /vender, not Verificación", () => {
    assert.equal(isAccountNavItemActive("/vender", { href: "/vender" }), true);
    assert.equal(
      isAccountNavItemActive("/vender", {
        href: "/verificacion",
        match: "verification",
      }),
      false,
    );
    // Historical bug: verified users had Verificación href=/vender.
    assert.equal(
      isAccountNavItemActive("/vender", {
        href: "/vender",
        match: "verification",
      }),
      false,
    );
  });

  it("highlights Verificación on identity routes only", () => {
    assert.equal(
      isAccountNavItemActive("/verificacion", {
        href: "/verificacion",
        match: "verification",
      }),
      true,
    );
    assert.equal(
      isAccountNavItemActive("/verificacion/enviada", {
        href: "/verificacion/enviada",
        match: "verification",
      }),
      true,
    );
    assert.equal(
      isAccountNavItemActive("/vender/abc", {
        href: "/verificacion",
        match: "verification",
      }),
      false,
    );
  });

  it("does not treat listing wizard URLs as Mis anuncios", () => {
    assert.equal(
      isAccountNavItemActive("/vender/abc", { href: "/vender" }),
      false,
    );
  });

  it("distinguishes Anuncios activos from Archivados via vista", () => {
    assert.equal(isAccountNavItemActive("/vender", { href: "/vender" }), true);
    assert.equal(
      isAccountNavItemActive(
        "/vender",
        { href: "/vender?vista=archivados" },
        "vista=archivados",
      ),
      true,
    );
    assert.equal(
      isAccountNavItemActive(
        "/vender",
        { href: "/vender" },
        "vista=archivados",
      ),
      false,
    );
    assert.equal(
      isAccountNavItemActive("/vender", {
        href: "/vender?vista=archivados",
      }),
      false,
    );
    assert.equal(
      isAccountNavItemActive(
        "/vender",
        { href: "/vender" },
        "q=pro&orden=price_asc",
      ),
      true,
    );
    assert.equal(
      isAccountNavItemActive(
        "/vender",
        { href: "/vender?vista=archivados" },
        "?vista=archivados&q=pro",
      ),
      true,
    );
  });
});
