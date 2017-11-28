---
title: "Homepage"
---
Hello world! I'm `content/index.md`

## Posts

{{ range where .Site.Pages "Section" "posts" }}
  <a href="{{ .Permalink }}" title="View {{ .Title }}">{{ .Title }}</a>
{{{ end }}