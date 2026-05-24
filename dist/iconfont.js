/**
 * 阿里巴巴 IconFont - 本地 SVG Symbol
 * ----------------------------------------------------------------
 * 使用说明（推荐替换为你自己的 IconFont 项目）：
 *   1. 打开 https://www.iconfont.cn 注册并创建一个项目
 *   2. 选择需要的图标加入项目，并在「项目设置」中开启 Symbol
 *   3. 点击「Symbol → 生成代码」获得形如：
 *        //at.alicdn.com/t/c/font_xxxxxxx_xxxxxx.js
 *   4. 将 index.html 中的 <script src="/iconfont.js"> 替换为上面的链接
 *      或直接替换本文件内容为该 .js 的内容即可
 * ----------------------------------------------------------------
 * 当前内置图标（symbol id）：
 *   icon-game        游戏手柄（品牌/通用游戏素材）
 *   icon-magic       魔法棒（创作/AI 解析）
 *   icon-result      结果列表
 *   icon-folder      文件夹（上传）
 *   icon-image       图片
 *   icon-video       视频
 *   icon-sword       剑（仙侠 / 道具）
 *   icon-radiation   辐射（末日废土）
 *   icon-wheat       麦穗（田园牧歌）
 *   icon-castle      城堡（地牢冒险 / 建筑）
 *   icon-wizard      巫师（角色）
 *   icon-tree        树木（植被）
 *   icon-mountain    山脉（地形）
 *   icon-cloud       云朵（天空）
 *   icon-sparkle     闪光（创作工作台）
 *   icon-search      搜索（AI 解析）
 *   icon-crown       皇冠（会员/折扣标识）
 *   icon-flash       闪电（积分/能量值）
 *   icon-reset       重置/刷新
 *   icon-info        信息提示
 *   icon-model       模型/立方体
 *   icon-history     历史记录（工具栏）
 *   icon-setting     设置（工具栏）
 *   icon-task        任务视图（顶部筛选）
 *   icon-monitor     显示器（画布空状态插画）
 *   icon-plus        新建/加号
 *   icon-expand      扩图
 *   icon-clear       清除/橡皮
 *   icon-down        下拉箭头
 *   icon-doc         文档/模板
 */
;(function (window) {
  var svgSprite =
    '<svg>' +
    // 游戏手柄
    '<symbol id="icon-game" viewBox="0 0 1024 1024">' +
    '<path d="M832 256H192C103.6 256 32 327.6 32 416v256c0 88.4 71.6 160 160 160 50.5 0 95.5-23.4 124.8-60H707.2c29.3 36.6 74.3 60 124.8 60 88.4 0 160-71.6 160-160V416c0-88.4-71.6-160-160-160zM416 576h-64v64a32 32 0 1 1-64 0v-64h-64a32 32 0 1 1 0-64h64v-64a32 32 0 1 1 64 0v64h64a32 32 0 1 1 0 64zm224-32a32 32 0 1 1 0-64 32 32 0 0 1 0 64zm64 96a32 32 0 1 1 0-64 32 32 0 0 1 0 64zm64-96a32 32 0 1 1 0-64 32 32 0 0 1 0 64zm64 96a32 32 0 1 1 0-64 32 32 0 0 1 0 64z" fill="currentColor"/>' +
    '</symbol>' +
    // 魔法棒
    '<symbol id="icon-magic" viewBox="0 0 1024 1024">' +
    '<path d="M192 64l32 96 96 32-96 32-32 96-32-96-96-32 96-32zM832 128l24 72 72 24-72 24-24 72-24-72-72-24 72-24zM896 768l24 72 72 24-72 24-24 72-24-72-72-24 72-24zM640 192l-448 448a64 64 0 0 0 0 90.5l101.5 101.5a64 64 0 0 0 90.5 0l448-448a64 64 0 0 0 0-90.5l-101.5-101.5a64 64 0 0 0-90.5 0zm-96 192l128 128-320 320-128-128 320-320z" fill="currentColor"/>' +
    '</symbol>' +
    // 结果列表
    '<symbol id="icon-result" viewBox="0 0 1024 1024">' +
    '<path d="M192 128h640a64 64 0 0 1 64 64v704a64 64 0 0 1-64 64H192a64 64 0 0 1-64-64V192a64 64 0 0 1 64-64zm96 192a32 32 0 0 0 0 64h448a32 32 0 0 0 0-64H288zm0 160a32 32 0 0 0 0 64h448a32 32 0 0 0 0-64H288zm0 160a32 32 0 0 0 0 64h288a32 32 0 0 0 0-64H288zM640 64h-256a32 32 0 0 0-32 32v32h320v-32a32 32 0 0 0-32-32z" fill="currentColor"/>' +
    '</symbol>' +
    // 文件夹
    '<symbol id="icon-folder" viewBox="0 0 1024 1024">' +
    '<path d="M896 256H512l-96-96H128a64 64 0 0 0-64 64v640a64 64 0 0 0 64 64h768a64 64 0 0 0 64-64V320a64 64 0 0 0-64-64z" fill="currentColor"/>' +
    '</symbol>' +
    // 图片
    '<symbol id="icon-image" viewBox="0 0 1024 1024">' +
    '<path d="M896 128H128a64 64 0 0 0-64 64v640a64 64 0 0 0 64 64h768a64 64 0 0 0 64-64V192a64 64 0 0 0-64-64zM320 320a64 64 0 1 1 0 128 64 64 0 0 1 0-128zm576 448H160l192-256 128 160 192-224 224 320z" fill="currentColor"/>' +
    '</symbol>' +
    // 视频
    '<symbol id="icon-video" viewBox="0 0 1024 1024">' +
    '<path d="M832 192H192a96 96 0 0 0-96 96v448a96 96 0 0 0 96 96h640a96 96 0 0 0 96-96V288a96 96 0 0 0-96-96zM448 672V352l256 160-256 160z" fill="currentColor"/>' +
    '</symbol>' +
    // 剑
    '<symbol id="icon-sword" viewBox="0 0 1024 1024">' +
    '<path d="M896 64h-128L320 512l-96-32-96 96 128 128-96 96 64 64 96-96 128 128 96-96-32-96 448-448V64zM320 832l-128-128-64 64 128 128 64-64z" fill="currentColor"/>' +
    '</symbol>' +
    // 辐射
    '<symbol id="icon-radiation" viewBox="0 0 1024 1024">' +
    '<path d="M512 416a96 96 0 1 0 0 192 96 96 0 0 0 0-192zM480 96v224a192 192 0 0 0-160 92L128 304a448 448 0 0 1 352-208zM896 304L704 412a192 192 0 0 0-160-92V96a448 448 0 0 1 352 208zM544 928v-224a192 192 0 0 0 160-92l192 108a448 448 0 0 1-352 208zm-64 0a448 448 0 0 1-352-208l192-108a192 192 0 0 0 160 92v224z" fill="currentColor"/>' +
    '</symbol>' +
    // 麦穗
    '<symbol id="icon-wheat" viewBox="0 0 1024 1024">' +
    '<path d="M512 64v896M384 192c0 96 64 160 128 192-64 32-128 96-128 192 96 0 160-64 192-128 32 64 96 128 192 128 0-96-64-160-128-192 64-32 128-96 128-192-96 0-160 64-192 128-32-64-96-128-192-128zM384 480c0 96 64 160 128 192-64 32-128 96-128 192 96 0 160-64 192-128 32 64 96 128 192 128 0-96-64-160-128-192 64-32 128-96 128-192-96 0-160 64-192 128-32-64-96-128-192-128z" fill="currentColor"/>' +
    '</symbol>' +
    // 城堡
    '<symbol id="icon-castle" viewBox="0 0 1024 1024">' +
    '<path d="M128 384v512h192V704h128v192h128V704h128v192h192V384h-64v64h-128V384h-64v64H448V384h-64v64H256V384h-128zM128 320h128V192h-64v-64h-64v192zM320 320h128V128h-64V64h-64v256zM512 320h128V192h-64v-64h-64v192zM704 320h128V64h-64v64h-64v192zM896 320h0V128h-64v64h-64v128h128z" fill="currentColor"/>' +
    '</symbol>' +
    // 巫师
    '<symbol id="icon-wizard" viewBox="0 0 1024 1024">' +
    '<path d="M512 64L256 416h512L512 64zM320 480l-64 192h512l-64-192H320zM192 736v64c0 70 58 128 128 128h384c70 0 128-58 128-128v-64H192z" fill="currentColor"/>' +
    '</symbol>' +
    // 树木
    '<symbol id="icon-tree" viewBox="0 0 1024 1024">' +
    '<path d="M512 64L192 480h128L160 736h192L256 928h512l-96-192h192L544 480h128L512 64zM448 928v-128h128v128H448z" fill="currentColor"/>' +
    '</symbol>' +
    // 山脉
    '<symbol id="icon-mountain" viewBox="0 0 1024 1024">' +
    '<path d="M64 832l256-448 192 320 96-160 352 288H64zM320 256a96 96 0 1 1 0 192 96 96 0 0 1 0-192z" fill="currentColor"/>' +
    '</symbol>' +
    // 云朵
    '<symbol id="icon-cloud" viewBox="0 0 1024 1024">' +
    '<path d="M800 416c-16 0-32 2-48 6C720 304 624 224 512 224c-128 0-240 96-256 224-96 16-160 96-160 192 0 112 90 192 192 192h528c106 0 192-86 192-192 0-122-100-224-208-224z" fill="currentColor"/>' +
    '</symbol>' +
    // 闪光
    '<symbol id="icon-sparkle" viewBox="0 0 1024 1024">' +
    '<path d="M512 64l96 320 320 96-320 96-96 320-96-320L96 480l320-96zM192 96l32 96 96 32-96 32-32 96-32-96-96-32 96-32zM832 736l24 72 72 24-72 24-24 72-24-72-72-24 72-24z" fill="currentColor"/>' +
    '</symbol>' +
    // 搜索
    '<symbol id="icon-search" viewBox="0 0 1024 1024">' +
    '<path d="M448 96a352 352 0 0 1 280 565l181 181a45 45 0 1 1-64 64L664 725A352 352 0 1 1 448 96zm0 90a262 262 0 1 0 0 524 262 262 0 0 0 0-524z" fill="currentColor"/>' +
    '</symbol>' +
    // 皇冠（会员）
    '<symbol id="icon-crown" viewBox="0 0 1024 1024">' +
    '<path d="M128 320l128 192L448 192l64 192 64-192 192 320 128-192 64 384v64H64v-64l64-384zM128 832h768v64H128v-64z" fill="currentColor"/>' +
    '</symbol>' +
    // 闪电（积分/能量）
    '<symbol id="icon-flash" viewBox="0 0 1024 1024">' +
    '<path d="M576 64L192 576h256L384 960l448-512H576L640 64H576z" fill="currentColor"/>' +
    '</symbol>' +
    // 重置
    '<symbol id="icon-reset" viewBox="0 0 1024 1024">' +
    '<path d="M512 128a384 384 0 1 1-272 112l45 45A320 320 0 1 0 512 192v96L384 160l128-128v96zm-160 480a160 160 0 1 0 320 0 160 160 0 0 0-320 0z" fill="currentColor"/>' +
    '</symbol>' +
    // 信息
    '<symbol id="icon-info" viewBox="0 0 1024 1024">' +
    '<path d="M512 64a448 448 0 1 0 0 896 448 448 0 0 0 0-896zm0 192a48 48 0 1 1 0 96 48 48 0 0 1 0-96zm64 544h-128v-32h32V480h-32v-32h96v320h32v32z" fill="currentColor"/>' +
    '</symbol>' +
    // 模型 / 立方体
    '<symbol id="icon-model" viewBox="0 0 1024 1024">' +
    '<path d="M512 64L96 288v448l416 224 416-224V288L512 64zm0 96l288 156-288 156-288-156 288-156zM160 384l320 172v320L160 704V384zm704 320L544 876V556l320-172v320z" fill="currentColor"/>' +
    '</symbol>' +
    // 历史 / 时钟
    '<symbol id="icon-history" viewBox="0 0 1024 1024">' +
    '<path d="M512 64a448 448 0 1 0 0 896 448 448 0 0 0 0-896zm0 96a352 352 0 1 1 0 704 352 352 0 0 1 0-704zm-32 96v272l192 112 32-54-160-94V256h-64z" fill="currentColor"/>' +
    '</symbol>' +
    // 设置 / 齿轮
    '<symbol id="icon-setting" viewBox="0 0 1024 1024">' +
    '<path d="M448 96l-32 96-96 40-96-32-64 64 32 96-40 96-96 32v96l96 32 40 96-32 96 64 64 96-32 96 40 32 96h128l32-96 96-40 96 32 64-64-32-96 40-96 96-32v-96l-96-32-40-96 32-96-64-64-96 32-96-40-32-96H448zm64 256a160 160 0 1 1 0 320 160 160 0 0 1 0-320z" fill="currentColor"/>' +
    '</symbol>' +
    // 任务 / 视图
    '<symbol id="icon-task" viewBox="0 0 1024 1024">' +
    '<path d="M128 128h288v288H128V128zm480 0h288v288H608V128zM128 608h288v288H128V608zm480 0h288v288H608V608z" fill="currentColor"/>' +
    '</symbol>' +
    // 显示器（空状态插画）
    '<symbol id="icon-monitor" viewBox="0 0 1024 1024">' +
    '<path d="M128 128h768a64 64 0 0 1 64 64v512a64 64 0 0 1-64 64H576v96h160v64H288v-64h160v-96H128a64 64 0 0 1-64-64V192a64 64 0 0 1 64-64zm32 96v448h704V224H160zm160 96h288v32H320v-32zm0 96h384v32H320v-32zm0 96h224v32H320v-32z" fill="currentColor"/>' +
    '</symbol>' +
    // 加号 / 新建
    '<symbol id="icon-plus" viewBox="0 0 1024 1024">' +
    '<path d="M480 128h64v352h352v64H544v352h-64V544H128v-64h352V128z" fill="currentColor"/>' +
    '</symbol>' +
    // 扩图 / 框
    '<symbol id="icon-expand" viewBox="0 0 1024 1024">' +
    '<path d="M128 128h256v64H192v192h-64V128zm512 0h256v256h-64V192H640v-64zM128 640h64v192h192v64H128V640zm704 0h64v256H640v-64h192V640zM352 352h320v320H352V352z" fill="currentColor"/>' +
    '</symbol>' +
    // 清除 / 橡皮
    '<symbol id="icon-clear" viewBox="0 0 1024 1024">' +
    '<path d="M256 768h512v64H256v-64zm168-528l364 364-200 200H384L184 604a64 64 0 0 1 0-90l242-242a64 64 0 0 1 90 0l-92-92zm-50 138L256 496l192 192 118-118-192-192z" fill="currentColor"/>' +
    '</symbol>' +
    // 下拉箭头
    '<symbol id="icon-down" viewBox="0 0 1024 1024">' +
    '<path d="M512 672L160 320l45-45 307 307 307-307 45 45L512 672z" fill="currentColor"/>' +
    '</symbol>' +
    // 文档 / 模板
    '<symbol id="icon-doc" viewBox="0 0 1024 1024">' +
    '<path d="M256 64h384l192 192v640a64 64 0 0 1-64 64H256a64 64 0 0 1-64-64V128a64 64 0 0 1 64-64zm352 64v160h160L608 128zM320 384h384v48H320v-48zm0 128h384v48H320v-48zm0 128h288v48H320v-48z" fill="currentColor"/>' +
    '</symbol>' +
    '</svg>'

  // 把 SVG sprite 注入到 body 末尾（与阿里 IconFont 行为一致）
  var inject = function () {
    var el = document.createElement('div')
    el.innerHTML = svgSprite
    var svg = el.getElementsByTagName('svg')[0]
    if (svg) {
      svg.setAttribute('aria-hidden', 'true')
      svg.style.position = 'absolute'
      svg.style.width = '0'
      svg.style.height = '0'
      svg.style.overflow = 'hidden'
      document.body.insertBefore(svg, document.body.firstChild)
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject)
  } else {
    inject()
  }
})(window)
