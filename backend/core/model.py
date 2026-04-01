from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv3D, ConvLSTM2D

def build_convlstm_autoencoder(input_shape=(10, 64, 64, 1)):
    """
    Builds a Spatial-Temporal Autoencoder using ConvLSTM layers.
    Shrinked dimensions for rapid CPU testing.
    """
    model = Sequential()
    
    # Encoder
    model.add(ConvLSTM2D(filters=32, kernel_size=(3, 3), 
                         strides=(1,1), padding='same', 
                         return_sequences=True, 
                         input_shape=input_shape))
                         
    # Decoder
    model.add(ConvLSTM2D(filters=32, kernel_size=(3, 3), 
                         strides=(1,1), padding='same', 
                         return_sequences=True))
                         
    # Reconstruct output
    model.add(Conv3D(filters=1, kernel_size=(3, 3, 3), 
                     activation='sigmoid', 
                     padding='same'))
                     
    model.compile(optimizer='adam', loss='mse')
    return model
