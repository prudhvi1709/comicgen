# Comics Generator

A web-based application that transforms images into comic book panels using OpenAI's image editing API. Upload a base image, provide captions for each panel, and generate a complete comic book layout.

## Features

- **Image Upload**: Support for JPG, PNG, and WebP formats
- **Multi-Panel Generation**: Create multiple comic panels from a single base image
- **Customizable Prompts**: Add custom prompt prefixes to control the comic style
- **Advanced Settings**: Configure image model, quality, fidelity, and output format
- **Multiple Download Options**: 
  - Download individual panels as JPG or PNG
  - Download all panels as a ZIP archive
  - Generate and download complete HTML comic layout
- **Custom HTML Templates**: Use AI-generated or default HTML templates for comic presentation
- **Persistent Settings**: API settings are saved locally for convenience

## Requirements

- Modern web browser with JavaScript enabled
- OpenAI API key with access to image editing endpoints
- Internet connection for API calls and CDN resources

## Setup

1. Clone or download this repository
2. Open `index.html` in a web browser
3. Click on "API Settings" to configure your OpenAI credentials:
   - Enter your OpenAI API key
   - Optionally modify the base URL (defaults to OpenAI's official endpoint)

## Usage

1. **Configure API Settings**: Expand the API Settings section and enter your OpenAI API key
2. **Upload Base Image**: Select an image file (JPG, PNG, or WebP) to use as the foundation for your comic
3. **Add Captions**: Enter one caption per line in the text area. Each line will generate a separate comic panel
4. **Adjust Advanced Settings** (optional):
   - Modify the prompt prefix to control the artistic style
   - Select image quality and fidelity settings
   - Choose output format preferences
   - Customize HTML template generation prompts
5. **Generate Comic**: Click "Generate Comic" to create your panels
6. **Download Results**: Choose from multiple download options once generation is complete

## API Configuration

The application uses OpenAI's image editing API with the following default settings:

- **Model**: `gpt-image-1`
- **Input Fidelity**: High
- **Quality**: High
- **Output Format**: JPEG
- **HTML Generation**: Uses `gpt-4o-mini` for custom template creation

## File Structure

```
comicgen/
├── index.html          # Main application interface
├── script.js           # Core application logic and API integration
└── README.md           # This documentation file
```

## Dependencies

The application uses the following external libraries via CDN:

- **Bootstrap 5.3.0**: UI framework and responsive design
- **Font Awesome 6.0.0**: Icons and visual elements
- **JSZip 3.10.1**: ZIP file generation for bulk downloads (loaded dynamically)

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## API Costs

This application makes API calls to OpenAI's image editing endpoint. Costs depend on:
- Number of panels generated
- Image resolution and quality settings
- Custom HTML template generation (uses GPT-4o-mini)

Refer to OpenAI's pricing documentation for current rates.

## Privacy and Security

- API keys are stored locally in browser localStorage
- Images are processed client-side before being sent to OpenAI
- No data is stored on external servers beyond OpenAI's processing
- Generated images are returned as base64 data and handled entirely client-side

## Troubleshooting

**API Key Issues**:
- Ensure your OpenAI API key is valid and has access to image editing endpoints
- Check that your API key has sufficient credits

**Image Upload Problems**:
- Verify the image is in a supported format (JPG, PNG, WebP)
- Ensure the image file is not corrupted

**Generation Failures**:
- Check browser console for detailed error messages
- Verify internet connection for API calls
- Ensure the base URL is correctly configured

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly across different browsers
5. Submit a pull request with a clear description of changes

## License

[MIT License](LICENSE)