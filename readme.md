# **Design Document: AI-Powered Dungeon Master Assistant**
## **1. Overview**
Develop a local Large Language Model (LLM) with retrieval augmentation that integrates Dungeons & Dragons source material provided in Word/PDF format. The LLM will function as an OpenAI-compatible endpoint, dynamically incorporating previously accepted narration into future responses. A multi-user web interface will facilitate interaction between Dungeon Masters (DMs) and Players.

## **2. System Architecture**
### **2.1 Hardware Requirements**
- **Processing Units:** NVIDIA 2080Ti, RTX 5070
- **Storage:** Sufficient SSD space for storing indexed source materials and session logs
- **Memory:** At least 32GB RAM recommended for smooth operation

### **2.2 Software & Libraries**
- **LLM Framework:** Ollama for local model hosting
- **Retrieval Augmentation:** ChromaDB for semantic search over structured lore
- **Orchestration:** LangChain for managing interactions between the model and external data sources
- **Database:** PostgreSQL for storing game sessions and narration context
- **Frontend Development:** React for web-based UI, Swift if developing an iOS app

## **3. Core Features**
### **3.1 LLM and Retrieval Augmentation**
- **Contextual Learning:** Previous narration should be retained to influence ongoing storytelling
- **Dynamic Source Material Integration:** DMs can upload official D&D sourcebooks in Word/PDF format for retrieval enhancement
- **Game-Specific Adaptation:** Fine-tuning on campaign-specific lore where applicable

### **3.2 Multi-User Web Interface**
- **User Roles:**
  - **Dungeon Master (DM):** Provides prompts for setting location, context, and narrative progression
  - **Players:** Receive and react to narration in real-time
- **DM Controls:**
  - Accept, Reject, or Edit AI-generated narration before sending it to players
  - Select which players receive narration (default: all)
- **Session Conclusion:**
  - Create a game log summarizing key events and presenting them as a short story
  - Store logs persistently for future sessions

## **4. Persistent Game Journaling**
- **Session Logs:** Captures key moments, conversations, and accepted narration
- **Campaign Continuity:** Allows future sessions to build on past narratives
- **Editable Story Outputs:** DM can refine logs before finalizing them

## **5. Additional Considerations**
- **User Experience Enhancements:** Provide intuitive UI components for quick editing and narration flow control
- **Scalability:** Support multiple concurrent campaigns with separate data indexing
- **Optimization for Latency:** Ensure fast retrieval augmentation via efficient caching and vector search mechanisms

