# TruePhone Component Library

Version 1.0

---

# Purpose

This document defines every reusable UI component used throughout TruePhone.

Before creating a new component, engineers and AI coding assistants must first verify that an existing component cannot satisfy the requirement.

Consistency is more valuable than originality.

Duplicate components should never exist.

---

# Component Design Principles

Every component should be:

Reusable

Composable

Accessible

Responsive

Strongly typed

Well documented

Server Component by default

Client Component only when necessary

---

Every component should have:

Loading State

Disabled State

Error State (when applicable)

Hover State

Focus State

Active State

---

# Naming Convention

Use PascalCase.

Examples

Button

Card

Input

SearchBar

ListingCard

SellerCard

ReviewCard

OrderCard

PriceDisplay

BatteryHealthBadge

TrustBadge

PageHeader

SectionHeader

EmptyState

LoadingSkeleton

ErrorState

SuccessBanner

---

Never abbreviate component names.

Names should describe purpose, not appearance.

---

# Component Categories

1. Layout Components

2. Navigation Components

3. Form Components

4. Data Display Components

5. Marketplace Components

6. Feedback Components

7. Utility Components

8. Dashboard Components

---

# Phase 1 Priority (Design System)

Build these before feature screens. Look and feel follow `docs/DESIGN_SYSTEM.md` (Figma visual reference). Feature scope and order follow `docs/plan.md`.

Brand: **TruePhone**.

| Priority | Component                                 | Notes                                        |
| -------- | ----------------------------------------- | -------------------------------------------- |
| P0       | Button                                    | Black primary CTA; full-width mobile support |
| P0       | Badge / TrustBadge                        | VERIFICADO and condition chips               |
| P0       | BottomNav                                 | Home, Search, Sell, Purchases, Profile       |
| P0       | AppHeader                                 | Logo + cart                                  |
| P0       | FilterChip / FilterChipGroup              | Horizontal model filters                     |
| P1       | ListingCard                               | Featured grid card                           |
| P1       | PriceDisplay                              | Price + protection fee breakdown             |
| P1       | GuaranteeBanner                           | Compra Garantizada (trust blue)              |
| P1       | SellerCard                                | Avatar + verification                        |
| P1       | StepProgressHeader                        | PASO X DE Y                                  |
| P1       | ReviewQueueRow                            | Reviewer cola list item                      |
| P1       | SearchBar                                 | Home search                                  |
| P1       | EmptyState / ErrorState / LoadingSkeleton | Required page states                         |
| P2       | Input / Textarea / Select                 | Forms                                        |
| P2       | Dialog / Drawer                           | Mobile sheets                                |
| P2       | Avatar / Card / Pagination / Toast        | Supporting primitives                        |

Do not invent one-off UI in feature folders when a component above can be extended.

---

# Layout Components

---

## Container

Purpose

Provides consistent horizontal spacing.

Used on every public page.

---

## Section

Defines logical page sections.

Supports:

Title

Subtitle

Content

Actions

---

## Stack

Vertical spacing helper.

Eliminates repeated margin classes.

---

## Grid

Responsive layout helper.

Supports:

2 columns

3 columns

4 columns

Auto-fit

---

## Divider

Visual separation.

Use sparingly.

Prefer whitespace whenever possible.

---

# Navigation Components

---

## Navbar

Public / desktop navigation.

Includes:

TruePhone logo

Search

Browse

Sell

Authentication

Profile

---

## AppHeader

Mobile marketplace header.

Includes:

TruePhone wordmark / logo

Cart or secondary action

---

## BottomNav

Primary mobile shell navigation.

Destinations:

Home

Search

Sell

Purchases

Profile

Active state must be obvious. Labels required (icons alone are not enough).

---

## FilterChip

Horizontal filter control (e.g. TODOS, iPhone 15).

Used on Home and search results.

---

## DashboardSidebar

Internal dashboard navigation.

Only used inside authenticated areas.

---

## Breadcrumb

Used only for deep navigation.

Avoid unnecessary breadcrumbs.

---

## Pagination

Reusable pagination component.

Supports:

Previous

Next

Page numbers

Keyboard navigation

---

# Button Components

---

## Button

Variants

Primary

Secondary

Outline

Ghost

Destructive

Link

Sizes

Small

Medium

Large

Supports:

Loading

Disabled

Icons

Full Width

---

Never create custom buttons.

Extend Button instead.

---

## IconButton

Square button.

Icon only.

Requires accessible label.

---

# Form Components

---

## Input

Single-line text.

Supports:

Label

Helper text

Validation

Prefix

Suffix

Character counter

---

## Textarea

Auto-growing.

Character count.

Validation.

---

## Select

Searchable.

Keyboard accessible.

Supports groups.

---

## Checkbox

Standard checkbox.

---

## RadioGroup

Single selection.

---

## Switch

Binary setting.

---

## Slider

Numeric selection.

---

## DatePicker

Calendar input.

Future support for localization.

---

## ImageUploader

Supports:

Drag & Drop

Progress

Preview

Reordering

Validation

Compression

Multiple uploads

---

## SearchBar

One of the most important components.

Supports:

Debounce

Autocomplete

Suggestions

Keyboard shortcuts

Loading

Clear button

---

# Marketplace Components

---

## ListingCard

Primary marketplace component.

Displays:

Photo

Model

Storage

Battery Health

Condition

Seller Rating

City

Price

Favorite Button

Trust Badge

Hover State

---

ListingCard should never contain business logic.

---

## ListingGallery

Image viewer.

Supports:

Zoom

Fullscreen

Swipe

Thumbnails

Keyboard navigation

---

## PriceDisplay

Displays:

Listing Price

Buyer Protection Fee

Total Price

Savings (future)

Formatting should be centralized.

---

## BatteryHealthBadge

Displays battery condition.

Should use consistent thresholds.

Never hardcode colors.

Use design tokens.

---

## TrustBadge

Examples

Manual Review

Verified Seller

VERIFICADO

Protected Purchase

Featured

Use trust blue (`--trust`). Never use primary black for verification badges.

---

## GuaranteeBanner

Compra Garantizada / trust band.

Uses trust blue surface, short copy, and optional shield icon.

One job: reinforce buyer protection.

---

## StepProgressHeader

Multi-step verification header.

Shows:

Step index (PASO X DE Y)

Progress percentage or bar

Section title (e.g. seller security flow)

---

## ReviewQueueRow

Reviewer dashboard list item.

Shows:

Device / listing title

Seller name

Timestamp

Thumbnail

Status context from parent tabs (Todos / Pendiente / En Revisión)

---

## SellerCard

Displays:

Avatar

Rating

Completed Sales

Response Time

Member Since

Verification Badge

---

## ReviewCard

Displays:

Reviewer

Rating

Comment

Transaction Date

---

## OrderCard

Displays:

Status

Device

Buyer/Seller

Timeline

Payment Status

---

# Dashboard Components

---

## StatsCard

Metric

Trend

Icon

Optional chart

---

## DataTable

Reusable table.

Supports:

Sorting

Filtering

Pagination

Selection

Bulk actions

Responsive layout

---

## FilterPanel

Reusable filter sidebar.

Supports:

Collapsible sections

Reset filters

Apply filters

---

## Timeline

Used for:

Orders

Listing history

Review history

---

# Feedback Components

---

## EmptyState

Illustration

Title

Description

Primary Action

Optional Secondary Action

---

## ErrorState

Title

Description

Retry Button

Support Link

---

## LoadingSkeleton

Every page should use skeletons instead of full-page spinners.

Skeletons should resemble final content.

---

## SuccessBanner

Confirmation messages.

Dismissible.

---

## Toast

Temporary notifications.

Should never contain critical information.

---

## Alert

Inline message.

Variants:

Info

Success

Warning

Error

---

## ConfirmationDialog

Required before:

Delete

Archive

Cancel

Remove

Reset

Permanent actions

---

# Utility Components

---

## Avatar

Supports:

Image

Initials

Fallback

Online Status

---

## Badge

Variants:

Success

Warning

Error

Neutral

Information

---

## Tooltip

Short explanations.

Never hide critical information inside tooltips.

---

## Modal

Small workflows.

Never large forms.

---

## Drawer

Preferred on mobile.

Useful for:

Filters

Notifications

Menus

---

## Spinner

Use only for very small loading indicators.

Never as a full-page loading experience.

---

# Page Components

---

## PageHeader

Title

Description

Primary Action

Secondary Action

Breadcrumb (optional)

---

## SectionHeader

Title

Description

Action

---

## PageFooter

Only for public pages.

---

# Charts

Future dashboard use.

Prefer simple charts.

Avoid unnecessary visual complexity.

Supported:

Line

Bar

Area

Donut

---

# Component Rules

Every component must support:

Dark Mode

Keyboard Navigation

Focus States

Responsive Layout

Accessibility

Localization

Loading State

Empty State (if applicable)

Error State (if applicable)

---

# Props

Component APIs should be:

Predictable

Strongly typed

Minimal

Avoid excessive optional props.

Prefer composition over configuration.

---

# Business Logic

Business logic should never exist inside reusable UI components.

Components display data.

Services perform business logic.

Server Actions mutate data.

---

# Testing

Every reusable component should include:

Unit tests

Accessibility tests

Visual regression tests (future)

Interaction tests where appropriate

---

# Documentation

Every public component should document:

Purpose

Props

Examples

Variants

Accessibility notes

Usage guidelines

Common mistakes

---

# Before Creating a New Component

Ask:

Can an existing component solve this problem?

Can the existing component be extended?

Will another team reuse this?

If the answer is "yes," improve the existing component.

Do not create a new one.

---

# Final Rule

The user should never notice the component library.

They should only notice that the product feels consistent.

Consistency builds trust.

Trust builds the TruePhone brand.
