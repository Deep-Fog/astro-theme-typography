---
title: GitHub如何重置自有仓库的提交历史
pubDate: 2025-12-04
categories:
  - 折腾
description: ""
slug: "2025-12-04"
---

## Step.1

签出并切换到一个新的孤儿分支

```
git checkout --orphan latest_branch
```

## Step.2

暂存当前状态的所有文件

```
git add -A
```

## Step.3

形成孤儿分支的初始提交

```
git commit -m "init: ..."
```

## Step.4

删除旧的主分支

```
git branch -D main
```

## Step.5

将孤儿分支重命名为main(master)

```
git branch -m main
```

## Step.6

强制推送到GitHub

```
git push -f origin main --no-verify
```

note:"--no-verify"用来跳过代码检查
