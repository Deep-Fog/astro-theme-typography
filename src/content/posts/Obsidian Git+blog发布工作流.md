---
title: Obsidian Git+blog发布工作流
pubDate: 2025-11-01
categories:
  - 折腾
description: ""
slug: obsidian-git-workflow
tags:
  - AI
---

本教程分为两大部分：

- **第一部分：本地同步 (个人)** - 使用 Obsidian Git 插件，将你的**整个**笔记库安全、私密地同步到一个私有 GitHub 仓库。这是你的个人备份和多设备同步方案。
- **第二部分：自动发布 (公开)** - 设置一个 GitHub Action，监听你私有仓库中一个特定文件夹的变化，并自动将该文件夹中的笔记同步到一个**公开**的博客仓库。

**最终效果**：你在 Obsidian 中写作，将完成的文章拖入指定的“待发布”文件夹。剩下的所有事情——备份、发布、更新网站——都将自动完成。

#### **准备工作**

1.  **GitHub 账号**: 用于托管你的仓库。
2.  **Obsidian**: 你的本地写作环境。
3.  **Git**: 确保你的电脑上已经安装了 Git <sup>1</sup> [<sup>1</sup>](https://git-scm.com/downloads)。

---

### **第一步：创建两个 GitHub 仓库**

我们需要两个独立的仓库来划分私有笔记和公开文章。

1.  **私有笔记仓库 (Vault Repo)**

    - 在 GitHub 上创建一个**新仓库**。
    - **名称**: `obsidian-vault` (或其他你喜欢的名字)。
    - **类型**: **必须设置为 `Private` (私有)**。这是你的个人数据保险箱。
    - **不要**勾选任何初始化选项 (如 README)。

2.  **公开博客仓库 (Blog Repo)**
    - 再次创建一个**新仓库**。
    - **名称**: `my-awesome-blog` (或你的博客项目名)。
    - **类型**: 通常是 `Public` (公开)，这样别人才能访问你的博客。
    - 这个仓库将存放你的博客源代码 (例如 Astro, Hugo, Jekyll 等)。

---

### **第二部分：配置 Obsidian Git 进行本地同步**

这部分确保你的整个笔记库在所有设备上保持同步和备份。

#### **步骤 1: 安装和配置 Obsidian Git 插件**

1.  在 Obsidian 中，进入 **设置 > 第三方插件**，关闭安全模式。
2.  浏览社区插件市场，搜索 `Obsidian Git`，并进行**安装**和**启用**。
3.  在你的本地电脑上，找到你的 Obsidian 笔记库文件夹。

#### **步骤 2: 初始化并连接到你的私有仓库**

1.  **初始化本地仓库**:

    - 在 Obsidian 中，按 `Ctrl+P` (或 `Cmd+P`) 打开命令面板。
    - 输入并执行 `Git: Initialize repository`。

2.  **连接到远程私有仓库**:
    - 回到你 GitHub 上的**私有** `obsidian-vault` 仓库页面，复制其 HTTPS 地址 (例如 `https://github.com/your-username/obsidian-vault.git`)。
    - 在 Obsidian 命令面板中，执行 `Git: Add remote repository`。
    - 别名输入 `origin` (默认即可)，然后粘贴你刚刚复制的私有仓库地址。

#### **步骤 3: 创建用于个人同步的 PAT (个人访问令牌)**

你需要一个令牌作为密码来让 Obsidian 访问你的 GitHub 仓库。

1.  前往 GitHub **Settings > Developer settings > Personal access tokens > Tokens (classic)**。
2.  点击 **Generate new token (classic)**。
3.  **Note**: 命名为 `OBSIDIAN_PERSONAL_SYNC`。
4.  **Expiration**: 选择一个有效期 (为了方便可选 `No expiration`)。
5.  **Select scopes**: **仅勾选 `repo`** 即可。
6.  点击 **Generate token**，**并立即复制生成的令牌**。

#### **步骤 4: 完成首次同步**

1.  在 Obsidian 命令面板中，执行 `Git: Commit all changes`。输入提交信息，如 `Initial vault commit`。
2.  执行 `Git: Push`。
3.  此时可能会弹出登录窗口：
    - **用户名**: 你的 GitHub 用户名。
    - **密码**: **粘贴你刚刚生成的 PAT**，而不是你的 GitHub 登录密码。
4.  推送成功后，你的整个笔记库就备份到了私有的 `obsidian-vault` 仓库。

#### **步骤 5: 设置自动化**

1.  进入 `Obsidian Git` 插件的设置。
2.  将 **Vault backup interval** 和 **Auto pull interval** 都设置为一个合适的时间，例如 `10` 分钟。
3.  确保 **Push on backup** 和 **Pull updates on startup** 选项都已开启。

**至此，你的个人笔记同步系统已完美运行！**

---

### **第三部分：配置 GitHub Actions 实现自动发布**

现在，我们来设置那个神奇的“自动发布机器人”。

#### **步骤 1: 在你的笔记库中规划发布文件夹**

1.  在你的 Obsidian 笔记库的根目录下，创建一个新的文件夹，专门用来存放准备发布的文章。
2.  一个清晰的命名很重要，例如 `blog` 或 `published`。
3.  **工作流程**: 当你写完一篇文章并准备发布时，只需将它从你的草稿文件夹拖到这个 `blog` 文件夹中。

#### **步骤 2: 创建用于 Action 的第二个 PAT**

**安全最佳实践**：为不同的服务使用不同的令牌。我们为 Action 创建一个专用的新令牌。

1.  重复**第二部分步骤 3**的过程，创建一个**新的 PAT**。
2.  **Note**: 命名为 `BLOG_PUBLISH_ACTION`。
3.  **Scopes**: 同样**只勾选 `repo`**。
4.  生成并**立即复制这个新的令牌**。

#### **步骤 3: 将 Action 令牌设置为仓库秘密**

为了让 Action 安全地使用这个令牌，我们将它存储在**私有** `obsidian-vault` 仓库的 Secrets 中。

1.  前往 GitHub 上的**私有** `obsidian-vault` 仓库。
2.  点击 **Settings > Secrets and variables > Actions**。
3.  点击 **New repository secret**。
4.  **Name**: `ACCESS_TOKEN`
5.  **Secret**: 粘贴你在上一步创建的**第二个**（用于 Action 的）PAT。

#### **步骤 4: 创建 GitHub Action Workflow 文件**

这是自动化的核心逻辑。

1.  在你的本地 Obsidian 笔记库根目录下，创建以下路径和文件：`.github/workflows/publish-notes.yml`。
2.  将以下 YAML 代码粘贴到 `publish-notes.yml` 文件中：

```yaml
# Action 的名字
name: Publish Notes to Blog

# 触发条件：仅当 'blog/' 文件夹内容有变化并推送到 main 分支时运行
on:
  push:
    branches:
      - main
    paths:
      - 'blog/**' # 监控这个文件夹，'**' 表示文件夹内任何文件和子文件夹

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      # 步骤一：签出私有的 obsidian-vault 仓库
      - name: Checkout Obsidian Vault
        uses: actions/checkout@v3
        with:
          path: private-vault # 下载到名为 private-vault 的临时文件夹

      # 步骤二：使用我们设置的秘密令牌，签出公开的博客仓库
      - name: Checkout Blog Repo
        uses: actions/checkout@v3
        with:
          repository: your-username/my-awesome-blog # ✅ 修改为你的公开博客仓库路径
          token: ${{ secrets.ACCESS_TOKEN }} # 使用秘密令牌进行授权
          path: public-blog # 下载到名为 public-blog 的临时文件夹

      # 步骤三：同步文件（最关键的一步）
      - name: Sync Published Notes
        run: |
          rsync -av --delete \
            private-vault/blog/ \
            public-blog/src/content/posts/
          # ⚠️ 注意：rsync 会让目标文件夹和源文件夹完全一样
          # ✅ 源头: 'private-vault/blog/' -> 你笔记库里的发布文件夹
          # ✅ 目标: 'public-blog/src/content/posts/' -> 你博客项目里存放文章的文件夹，请务必修改为你自己的正确路径
          # --delete 参数意味着如果你在源头删除了一篇文章，目标文件夹里对应的文章也会被删除

      # 步骤四：提交变更到公开博客仓库
      - name: Commit and Push Changes
        run: |
          cd public-blog
          git config --global user.name 'github-actions[bot]'
          git config --global user.email 'github-actions[bot]@users.noreply.github.com'
          # 检查是否有文件变更
          if [ -n "$(git status --porcelain)" ]; then
            git add .
            git commit -m "docs: sync new posts from obsidian vault"
            git push
          else
            echo "No changes detected. Nothing to push."
          fi
```

**请务必修改 YAML 文件中的两个路径为你自己的配置！**

#### **步骤 5: 测试你的完整工作流**

1.  在 Obsidian 中，将一篇测试笔记拖入 `blog` 文件夹。
2.  等待 Obsidian Git 插件自动同步，或手动 `Commit` & `Push`。
3.  前往你**私有** `obsidian-vault` 仓库的 **Actions** 选项卡。
4.  你会看到一个名为 `Publish Notes to Blog` 的工作流正在运行。
5.  当它成功完成（显示绿色对勾）后，检查你的**公开** `my-awesome-blog` 仓库。你会发现一个由 `github-actions[bot]` 创建的新提交，并且你的测试笔记已经出现在了指定的文件家中！

如果你的博客仓库本身连接了 Vercel 或 Netlify 等自动化部署平台，这个 push 会接着触发博客的重新构建和上线。

**大功告成！** 你已经建立了一个无缝、自动化的个人知识管理与公开同步系统。
