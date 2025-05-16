# Legal Term Explainer Chrome Extension

A Chrome extension that explains legal terms and provides related articles from hukumonline.com when text is selected on a webpage. Powered by Google Gemini API.

## Features

- Select text on any webpage to trigger a tooltip menu
- Get explanations of legal terms directly from an AI API
- Find related articles from hukumonline.com
- Simple and intuitive user interface

## Installation

### Development Mode Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top right corner
4. Click "Load unpacked" and select the directory containing this extension
5. The extension should now be installed and visible in your Chrome toolbar

### Configuration

1. Get a Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)
2. Click on the extension icon in the Chrome toolbar
3. Enter your Google Gemini API key in the settings popup
4. Click "Save Settings"

## Usage

1. Select any text on a webpage
2. A tooltip menu will appear with two options:
   - **Explain**: Get an explanation of the selected text
   - **Get Related Articles**: Find articles related to the selected text
3. Click on your desired option
4. View the explanation or related articles in the tooltip
5. Use the "Copy" button to copy explanations to your clipboard

## Technical Details

- Built with vanilla JavaScript
- Uses Chrome Extension Manifest V3
- Communicates with an AI API to get explanations and related articles
- Customizable styling via CSS

## License

MIT License
