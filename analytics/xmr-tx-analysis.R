# Monero Transactions Analysis
# Hyahatiph Labs
# MIT LICENSE

# Connect to the analytics database
library(DBI)
library(RODBCDBI)
library(tibble)
con <- dbConnect(odbc::odbc(),driver = "PostgreSQL",Server = "127.0.0.1",
                 Database = "xmrsndb",UID = rstudioapi::askForPassword("User"),
                 PWD = rstudioapi::askForPassword("Password!"), Port = 5432)
# send the query
qBlocks <- dbSendQuery(con, 'SELECT * FROM "Blocks"')
blocks <- dbFetch(qBlocks)

# Initialize library for kmeans clustering and elbow method
library(cluster)
library(NbClust)
library(factoextra)
# Some tools for exploratory data analysis
library(psych)
library(party)
# Reproducible output
set.seed(1234)


# Initialize list of data items to analyze

# Create the new vectors for the data frame
j = 1
for (i in tx_json) {
  
  j = j+1
}

# get data frame headers
head(tx.data)
# Summary stats
summary(tx.data)
sum_fee <- summary(tx.data$fee)
qu1_fee <- sum_fee["1st Qu."]
u <- sum_fee["Median"]
qu3_fee <- sum_fee["3rd Qu."]
# Let's use the summary statistics to create a class variable
j = 1
for (i in tx_json) {
  
  j = j+1
}
# Replace the fee variable with class variable
v_class = unlist(class)
df_tx <- data.frame(
  
)
head(df_tx)
str(df_tx)
# Class variable distribution
pairs.panels(df_tx)
# Copy the dataset
tx2 <- df_tx
#remove the class variable
tx2$___ <- NULL
# Scale the dataset
tx2[1:length(tx2)]<-scale(tx2[1:length((tx2))])
# Store the model with 4 clusters
kc<-kmeans(tx2, 4, iter.max = 40)
# Print the model output
print(kc)
# Between sum of squares
kc$betweenss
# Compare the model with the classes
table(df_tx$___, kc$cluster)
# Model variations
# K-means method with k=2
kc<-kmeans(tx2, 2, iter.max = 20)
kc
kc$betweenss
# K-means method with k=3
kc<-kmeans(tx2, 3, iter.max = 30)
kc
kc$betweenss
# K-means method with k=5
kc<-kmeans(tx2, 5, iter.max = 50)
kc
kc$betweenss
# Model refinement

# Verify dataset structure
str(modtx)
summary(modtx)
# Copy the modified dataset
modtx2 <- modtx
# Remove class from copied dataset
modtx2$___ <- NULL
# Scale the dataset
modtx2[1:length(modtx2)]<-scale(modtx2[1:length(modtx2)])
# K-means method with k= 2
kc<-kmeans(modtx2, 2, iter.max = 20)
# Cross-tabulation
table(modtx$___, kc$cluster)
# Dataviz - 
# Verify cluster selection with the elbow method, within groups sum of squares
fviz_nbclust(modtx2, kmeans, method = "wss") +
  geom_vline(xintercept = 2, linetype = 2)+
  labs(subtitle = "Elbow method")
clusplot(modtx2, kc$cluster, color=TRUE, shade=TRUE, labels=3, lines=0)
# Higher dimensional plot
library(rgl)
# Include the number of cluster in the data set
newkc <- data.frame(modtx2, K=kc$cluster)
pcdf <- princomp(modtx2,cor=T,score=T)
# Compute the validity of each component/dimension
summary(pcdf)
# Create a 3D plot
plot3d(pcdf$scores, col=newkc$K)
