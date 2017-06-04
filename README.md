# google-fonter-cmd
Command version of google font to local.

## Usage
As everyone knows that people in China cannot access Google and its other domain. This's a desktop application to download google fonts to local.

It has GUI version [here][] build by electron.

[here]: https://github.com/sirius1024/google-fonter

## Installation
```bash
npm install google-fonter-cmd -g
gfc -f <google font url> -p <local path>
```

## Demo
Windows

```bash
gfc -f https://fonts.googleapis.com/css?family=Varela+Round -p C:\Users\sirius\Desktop\wofftest\
```
MacOS/Linux
```bash
gfc -f https://fonts.googleapis.com/css?family=Varela+Round -p /home/sirius/fontFiles/
```