import { assert } from './testUtils'

describe(`mp-baidu: transform v-for`, () => {
  test(`with key`, () => {
    assert(
      `<view v-for="item in items" :key="item.id"/>`,
      `<view s-for="a trackBy item.id" s-for-item="item"/>`,
      `(_ctx, _cache) => {
  return { a: _f(_ctx.items, (item, k0, i0) => { return {}; }) }
}`
    )
  })
  test(`without key`, () => {
    assert(
      `<view v-for="item in items"/>`,
      `<view s-for="{{a}}" s-for-item="item"/>`,
      `(_ctx, _cache) => {
  return { a: _f(_ctx.items, (item, k0, i0) => { return {}; }) }
}`
    )
  })
})