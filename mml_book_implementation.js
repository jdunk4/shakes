// Romeo and Juliet MML Book Implementation Example
// This shows how the book object could be integrated into a game engine

class MMLBook {
  constructor(bookData) {
    this.data = bookData;
    this.currentPage = 1;
    this.isOpen = false;
    this.bookmarks = [];
    this.readingProgress = 0;
  }

  // Bookshelf Integration Methods
  getSpineDisplay() {
    return {
      title: this.data.game_integration.bookshelf_display.spine_title,
      author: this.data.game_integration.bookshelf_display.spine_author,
      color: this.data.game_integration.bookshelf_display.spine_color,
      texture: this.data.game_integration.bookshelf_display.spine_texture,
      thickness: this.data.game_integration.bookshelf_display.book_thickness
    };
  }

  onHover() {
    const trigger = this.data.game_integration.interaction_triggers.on_hover;
    return {
      showIcon: trigger.display_icon,
      tooltip: trigger.tooltip,
      preview: trigger.preview_text
    };
  }

  onClick() {
    this.isOpen = true;
    const trigger = this.data.game_integration.interaction_triggers.on_click;
    // Play sound effect, trigger transition
    console.log(`Playing: ${trigger.sound_effect}`);
    this.openBookInterface();
  }

  // Reading Interface Methods
  openBookInterface() {
    // Initialize the reading interface
    return {
      metadata: this.data.book.metadata,
      navigation: this.data.book.navigation.table_of_contents,
      currentPage: this.currentPage,
      bookmarks: this.bookmarks,
      quickAccess: this.data.book.quick_navigation
    };
  }

  turnToPage(pageNumber) {
    if (pageNumber >= 1 && pageNumber <= this.data.book.metadata.page_count) {
      this.currentPage = pageNumber;
      this.updateReadingProgress();
      return this.getCurrentPageContent();
    }
    return null;
  }

  goToScene(act, scene) {
    // Find the page number for the specific act and scene
    const actData = this.data.content.acts[act.toString()];
    if (actData && actData.scenes[scene.toString()]) {
      const targetPage = actData.scenes[scene.toString()].page;
      return this.turnToPage(targetPage);
    }
    return null;
  }

  goToFamousScene(sceneName) {
    const famousScenes = this.data.book.quick_navigation.famous_scenes;
    const scene = famousScenes.find(s => s.name === sceneName);
    if (scene) {
      return this.goToScene(scene.act, scene.scene);
    }
    return null;
  }

  getCurrentPageContent() {
    // Determine what content to show based on current page
    const page = this.currentPage;
    
    // Check if it's front matter
    if (page <= 4) {
      return this.getFrontMatterContent(page);
    }
    
    // Check if it's the prologue
    if (page === 5) {
      return this.data.content.prologue;
    }
    
    // Find which act/scene this page belongs to
    return this.findContentByPage(page);
  }

  getFrontMatterContent(page) {
    const frontMatter = this.data.content.front_matter;
    if (page === 1) return frontMatter.title_page;
    if (page === 2) return frontMatter.dramatis_personae;
    if (page === 4) return frontMatter.setting;
    return null;
  }

  findContentByPage(targetPage) {
    // Search through acts and scenes to find content for this page
    for (const [actNum, actData] of Object.entries(this.data.content.acts)) {
      for (const [sceneNum, sceneData] of Object.entries(actData.scenes)) {
        if (sceneData.page === targetPage) {
          return {
            type: 'scene',
            act: actNum,
            scene: sceneNum,
            content: sceneData
          };
        }
      }
    }
    return null;
  }

  addBookmark(page = this.currentPage) {
    const bookmark = {
      page: page,
      timestamp: new Date().toISOString(),
      content_preview: this.getPagePreview(page)
    };
    this.bookmarks.push(bookmark);
    return bookmark;
  }

  getPagePreview(page) {
    const content = this.getCurrentPageContent();
    if (content && content.content) {
      return content.content.substring(0, 100) + '...';
    }
    return 'Page ' + page;
  }

  searchText(query) {
    const results = [];
    const searchQuery = query.toLowerCase();
    
    // Search through all acts and scenes
    for (const [actNum, actData] of Object.entries(this.data.content.acts)) {
      for (const [sceneNum, sceneData] of Object.entries(actData.scenes)) {
        if (sceneData.content.toLowerCase().includes(searchQuery)) {
          results.push({
            act: actNum,
            scene: sceneNum,
            page: sceneData.page,
            title: sceneData.title,
            snippet: this.getSearchSnippet(sceneData.content, searchQuery)
          });
        }
      }
    }
    
    return results;
  }

  getSearchSnippet(text, query) {
    const index = text.toLowerCase().indexOf(query);
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + query.length + 50);
    return '...' + text.substring(start, end) + '...';
  }

  updateReadingProgress() {
    this.readingProgress = (this.currentPage / this.data.book.metadata.page_count) * 100;
    
    // Update the book's internal progress tracking
    this.data.book.reading_progress.current_page = this.currentPage;
    this.data.book.reading_progress.percentage_complete = this.readingProgress;
    this.data.book.reading_progress.last_read = new Date().toISOString();
  }

  // Character and Quote Access
  getCharacterInfo(characterName) {
    return this.data.book.characters.find(char => 
      char.name.toLowerCase().includes(characterName.toLowerCase())
    );
  }

  getFamousQuotes() {
    return this.data.book.quick_navigation.famous_quotes;
  }

  findQuote(quoteText) {
    const quotes = this.getFamousQuotes();
    return quotes.find(quote => 
      quote.quote.toLowerCase().includes(quoteText.toLowerCase())
    );
  }

  // Game Achievement Integration
  checkAchievements() {
    const achievements = [];
    const gameAchievements = this.data.game_integration.achievements;
    
    for (const achievement of gameAchievements) {
      if (this.evaluateAchievementCondition(achievement.unlock_condition)) {
        achievements.push(achievement);
      }
    }
    
    return achievements;
  }

  evaluateAchievementCondition(condition) {
    // Simple condition evaluation - in a real game this would be more sophisticated
    if (condition.includes('read_percentage >= 100')) {
      return this.readingProgress >= 100;
    }
    if (condition.includes('read_scene(2, 2)')) {
      // Check if they've read the balcony scene
      return this.hasReadScene(2, 2);
    }
    if (condition.includes('read_scene(5, 3)')) {
      // Check if they've read the final scene
      return this.hasReadScene(5, 3);
    }
    return false;
  }

  hasReadScene(act, scene) {
    // In a real implementation, this would track which scenes have been read
    // For now, assume if current page >= scene page, they've read it
    const sceneData = this.data.content.acts[act.toString()]?.scenes[scene.toString()];
    return sceneData && this.currentPage >= sceneData.page;
  }

  // Save/Load Progress
  saveProgress() {
    return {
      currentPage: this.currentPage,
      bookmarks: this.bookmarks,
      readingProgress: this.readingProgress,
      lastRead: new Date().toISOString()
    };
  }

  loadProgress(savedData) {
    if (savedData) {
      this.currentPage = savedData.currentPage || 1;
      this.bookmarks = savedData.bookmarks || [];
      this.readingProgress = savedData.readingProgress || 0;
    }
  }
}

// Usage Example
class GameBookshelf {
  constructor() {
    this.books = new Map();
  }

  async loadBook(bookId, bookDataUrl) {
    try {
      const response = await fetch(bookDataUrl);
      const bookData = await response.json();
      const book = new MMLBook(bookData);
      this.books.set(bookId, book);
      return book;
    } catch (error) {
      console.error('Failed to load book:', error);
      return null;
    }
  }

  getBook(bookId) {
    return this.books.get(bookId);
  }

  renderBookshelf() {
    const bookshelfHtml = [];
    
    for (const [bookId, book] of this.books) {
      const spine = book.getSpineDisplay();
      bookshelfHtml.push(`
        <div class="book-spine ${spine.texture} ${spine.color}" 
             data-book-id="${bookId}"
             style="height: ${this.getSpineHeight(spine.thickness)}px;">
          <div class="spine-title">${spine.title}</div>
          <div class="spine-author">${spine.author}</div>
        </div>
      `);
    }
    
    return bookshelfHtml.join('');
  }

  getSpineHeight(thickness) {
    const heights = {
      'thin': 120,
      'medium': 150,
      'thick': 180
    };
    return heights[thickness] || 150;
  }
}

// Example Usage:
/*
const bookshelf = new GameBookshelf();

// Load Romeo and Juliet
const romeoBook = await bookshelf.loadBook('romeo_juliet', './romeo_juliet_mml_book.json');

// Player clicks on book
romeoBook.onClick();

// Navigate to famous balcony scene
romeoBook.goToFamousScene('Balcony Scene');

// Search for a quote
const results = romeoBook.searchText('wherefore art thou');

// Add bookmark
romeoBook.addBookmark();

// Check achievements
const newAchievements = romeoBook.checkAchievements();
*/

export { MMLBook, GameBookshelf };
