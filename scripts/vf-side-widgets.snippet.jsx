            <aside className="vf-side-widgets">
              <section className="vf-widget">
                <header className="vf-widget-head">
                  <h3 className="vf-widget-title">使用小贴士</h3>
                </header>
                <ul className="vf-widget-list">
                  {TIP_ITEMS.map(({ Icon, title, desc }) => (
                    <li key={title} className="vf-widget-list-item">
                      <span className="vf-widget-thumb" aria-hidden="true">
                        <Icon />
                      </span>
                      <div className="vf-widget-body">
                        <strong>{title}</strong>
                        <p>{desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="vf-widget">
                <header className="vf-widget-head">
                  <h3 className="vf-widget-title">处理状态</h3>
                </header>
                <ul className="vf-widget-status-list">
                  <li>
                    <span className="vf-widget-status-label">视频</span>
                    <span className={`vf-pill vf-pill--${statusTone('video', null, { videoFile, isProcessing, extractComplete, progress })}`}>
                      {videoFile ? '已上传' : '未上传'}
                    </span>
                  </li>
                  <li>
                    <span className="vf-widget-status-label">关键帧</span>
                    <span className={`vf-pill vf-pill--${statusTone('frames', frameStatLabel, { videoFile, isProcessing, extractComplete, progress })}`}>
                      {frameStatLabel}
                    </span>
                  </li>
                  <li>
                    <span className="vf-widget-status-label">进度</span>
                    <span className={`vf-pill vf-pill--${statusTone('progress', progressStatLabel, { videoFile, isProcessing, extractComplete, progress })}`}>
                      {progressStatLabel}
                    </span>
                  </li>
                </ul>
              </section>

              <section className="vf-widget vf-widget--history">
                <header className="vf-widget-head">
                  <h3 className="vf-widget-title">历史记录</h3>
                  {history.length > 0 && (
                    <span className="vf-widget-action">共 {history.length} 条</span>
                  )}
                </header>
                {history.length === 0 ? (
                  <p className="vf-widget-empty">完成抽帧后将自动保存至此</p>
                ) : (
                  <ul className="vf-widget-list vf-widget-list--history">
                    {history.map((item) => (
                      <li key={item.id} className="vf-widget-list-item">
                        <span className="vf-widget-thumb vf-widget-thumb--img">
                          {item.thumbUrl ? (
                            <img src={item.thumbUrl} alt="" />
                          ) : (
                            <IconFont type="icon-image" />
                          )}
                        </span>
                        <div className="vf-widget-body">
                          <strong>{item.fileName}</strong>
                          <p>{item.frameCount} 帧 · {item.fps} FPS{item.removeBg ? ' · 已抠图' : ''}</p>
                          <div className="vf-widget-meta">
                            <span className="vf-pill vf-pill--success">已完成</span>
                            <span className="vf-widget-time">{formatHistoryTime(item.createdAt)}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </aside>
          </div>
        </div>
